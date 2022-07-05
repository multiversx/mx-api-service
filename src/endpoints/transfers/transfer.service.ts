import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionType } from "../transactions/entities/transaction.type";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionService } from "../transactions/transaction.service";
import { ApiUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";

@Injectable()
export class TransferService {
  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) { }

  private buildTransferFilterQuery(filter: TransactionFilter): ElasticQuery {
    let elasticQuery = ElasticQuery.create();

    if (filter.address) {
      const smartContractResultConditions = [
        QueryType.Match('receiver', filter.address),
        QueryType.Match('receivers', filter.address),
      ];

      if (AddressUtils.isSmartContractAddress(filter.address)) {
        smartContractResultConditions.push(QueryType.Match('sender', filter.address));
      }

      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.should, QueryType.Must([
        QueryType.Match('type', 'unsigned'),
        QueryType.Should(smartContractResultConditions),
      ], [
        QueryType.Exists('canBeIgnored'),
      ]))
        .withCondition(QueryConditionOptions.should, QueryType.Must([
          QueryType.Match('type', 'normal'),
          QueryType.Should([
            QueryType.Match('sender', filter.address),
            QueryType.Match('receiver', filter.address),
            QueryType.Match('receivers', filter.address),
          ]),
        ]));
    }

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
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', filter.before, filter.after);
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

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Transaction[]> {
    let elasticOperations = await this.indexerService.getTransfers(filter, pagination);
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

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerService.getTransfersCount(filter);
  }
}
