import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { ElasticSortProperty } from "src/common/elastic/entities/elastic.sort.property";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { ApiUtils } from "src/utils/api.utils";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionType } from "../transactions/entities/transaction.type";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionService } from "../transactions/transaction.service";
import { AddressUtils } from "src/utils/address.utils";

@Injectable()
export class TransferService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) { }

  private buildTransferFilterQuery(filter: TransactionFilter, address: string): ElasticQuery {
    const smartContractResultConditions = [
      QueryType.Match('receiver', address),
      QueryType.Match('receivers', address),
    ];

    if (AddressUtils.isSmartContractAddress(address)) {
      smartContractResultConditions.push(QueryType.Match('sender', address));
    }

    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, QueryType.Must([
        QueryType.Match('type', 'unsigned'),
        QueryType.Should(smartContractResultConditions),
      ], [
        QueryType.Exists('canBeIgnored'),
      ]))
      .withCondition(QueryConditionOptions.should, QueryType.Must([
        QueryType.Match('type', 'normal'),
        QueryType.Should([
          QueryType.Match('sender', address),
          QueryType.Match('receiver', address),
          QueryType.Match('receivers', address),
        ]),
      ]));

    if (filter.type) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('type', filter.type === TransactionType.Transaction ? 'normal' : 'unsigned'));
    }

    if (filter.sender) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('sender', filter.sender));
    }

    if (filter.receiver) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Should([
        QueryType.Match('receiver', filter.receiver),
        QueryType.Match('receivers', filter.receiver),
      ]));
    }

    if (filter.token) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('tokens', filter.token, QueryOperator.AND));
    }

    if (filter.function && this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('function', filter.function));
    }

    if (filter.senderShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('senderShard', filter.senderShard));
    }

    if (filter.receiverShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('receiverShard', filter.receiverShard));
    }

    if (filter.miniBlockHash) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('miniBlockHash', filter.miniBlockHash));
    }

    if (filter.hashes) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Should(filter.hashes.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Wildcard('data', `*${filter.search}*`));
    }

    if (filter.before || filter.after) {
      elasticQuery = elasticQuery.withFilter(QueryType.Range('timestamp', filter.before ?? Date.now(), filter.after ?? 0));
    }

    return elasticQuery;
  }

  private sortElasticTransfers(elasticTransfers: any[]): any[] {
    for (const elasticTransfer of elasticTransfers) {
      if (elasticTransfer.originalTxHash) {
        const transaction = elasticTransfers.find(x => x.txHash === elasticTransfer.originalTxHash);
        if (transaction) {
          elasticTransfer.order = (transaction.nonce * 10) + 1;
        } else {
          elasticTransfer.order = 0;
        }
      } else {
        elasticTransfer.order = elasticTransfer.nonce * 10;
      }
    }

    elasticTransfers.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }

      return b.order - a.order;
    });

    return elasticTransfers;
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination, address: string): Promise<Transaction[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.buildTransferFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    let elasticOperations = await this.elasticService.getList('operations', 'txHash', elasticQuery);
    elasticOperations = this.sortElasticTransfers(elasticOperations);

    const transactions: Transaction[] = [];

    for (const elasticOperation of elasticOperations) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), elasticOperation);
      transaction.type = elasticOperation.type === 'unsigned' ? TransactionType.SmartContractResult : TransactionType.Transaction;

      if (transaction.type === TransactionType.SmartContractResult) {
        delete transaction.gasLimit;
        delete transaction.gasPrice;
        delete transaction.gasUsed;
        delete transaction.nonce;
        delete transaction.round;
      }

      await this.transactionService.processTransaction(transaction);

      transactions.push(transaction);
    }

    return transactions;
  }

  async getTransfersCount(filter: TransactionFilter, address: string): Promise<number> {
    const elasticQuery = this.buildTransferFilterQuery(filter, address);

    return await this.elasticService.getCount('operations', elasticQuery);
  }
}
