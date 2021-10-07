import { Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api.config.service';
import { AbstractQuery } from 'src/common/entities/elastic/abstract.query';
import { ElasticPagination } from 'src/common/entities/elastic/elastic.pagination';
import { ElasticQuery } from 'src/common/entities/elastic/elastic.query';
import { ElasticSortOrder } from 'src/common/entities/elastic/elastic.sort.order';
import { ElasticSortProperty } from 'src/common/entities/elastic/elastic.sort.property';
import { QueryConditionOptions } from 'src/common/entities/elastic/query.condition.options';
import { QueryType } from 'src/common/entities/elastic/query.type';
import { GatewayService } from 'src/common/gateway.service';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { ElasticService } from '../../common/elastic.service';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionSendResult } from './entities/transaction.send.result';
import { QueryOperator } from 'src/common/entities/elastic/query.operator';
import { TransactionScamCheckService } from './scam-check/transaction-scam-check.service';
import { TransactionScamInfo } from './entities/transaction-scam-info';
import { TransactionGetService } from './transaction.get.service';
import { TokenTransferService } from './token.transfer.service';
import { TransactionPriceService } from './transaction.price.service';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { SmartContractResult } from './entities/smart.contract.result';
import { ElasticUtils } from 'src/utils/elastic.utils';
import { TermsQuery } from 'src/common/entities/elastic/terms.query';

@Injectable()
export class TransactionService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly transactionPriceService: TransactionPriceService,
    private readonly transactionScamCheckService: TransactionScamCheckService,
    private readonly transactionGetService: TransactionGetService,
    private readonly tokenTransferService: TokenTransferService,
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private buildTransactionFilterQuery(filter: TransactionFilter): AbstractQuery[] {

    const queries: AbstractQuery[] = [];
    if (filter.sender) {
      queries.push(QueryType.Match('sender', filter.sender));
    }

    if (filter.receiver) {
      queries.push(QueryType.Match('receiver', filter.receiver));
    }

    if (filter.token) {
      queries.push(QueryType.Match('tokens', filter.token, QueryOperator.AND));
    }

    if (filter.senderShard !== undefined) {
      queries.push(QueryType.Match('senderShard', filter.senderShard));
    }

    if (filter.receiverShard !== undefined) {
      queries.push(QueryType.Match('receiverShard', filter.receiverShard));
    }

    if (filter.miniBlockHash) {
      queries.push(QueryType.Match('miniBlockHash', filter.miniBlockHash));
    }

    if (filter.hashes) {
      const hashArray = filter.hashes.split(',');
      queries.push(QueryType.Should(hashArray.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      queries.push(QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      queries.push(QueryType.Wildcard('data', `*${filter.search}*`));
    }

    return queries;
  }

  async getTransactionCount(filter: TransactionFilter): Promise<number> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition[filter.condition ?? QueryConditionOptions.must] = this.buildTransactionFilterQuery(filter);

    if (filter.before || filter.after) {
      elasticQueryAdapter.filter = [
        QueryType.Range('timestamp', filter.before ?? 0, filter.after ?? 0),
      ]
    }

    return await this.elasticService.getCount('transactions', elasticQueryAdapter);
  }

  async getTransactions(filter: TransactionFilter, queryOptions?: TransactionQueryOptions): Promise<(Transaction | TransactionDetailed)[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();

    const { from, size } = filter;
    const pagination: ElasticPagination = {
      from, size
    };
    elasticQueryAdapter.pagination = pagination;
    elasticQueryAdapter.condition[filter.condition ?? QueryConditionOptions.must] = this.buildTransactionFilterQuery(filter);

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descending };
    const nonce: ElasticSortProperty = { name: 'nonce', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [timestamp, nonce];

    if (filter.before || filter.after) {
      elasticQueryAdapter.filter = [
        QueryType.Range('timestamp', filter.before ?? 0, filter.after ?? 0),
      ]
    }

    let elasticTransactions = await this.elasticService.getList('transactions', 'txHash', elasticQueryAdapter);

    let transactions: (Transaction | TransactionDetailed)[] = [];

    for (let elasticTransaction of elasticTransactions) {
      let transaction = ApiUtils.mergeObjects(new Transaction(), elasticTransaction);

      let tokenTransfer = this.tokenTransferService.getTokenTransfer(elasticTransaction);
      if (tokenTransfer) {
        transaction.tokenValue = tokenTransfer.tokenAmount;
        transaction.tokenIdentifier = tokenTransfer.tokenIdentifier;
      }

      transactions.push(transaction);
    }

    if (filter.hashes) {
      const txHashes: string[] = filter.hashes.split(',');
      const elasticHashes = elasticTransactions.map(({txHash}) => txHash);
      const missingHashes: string[] = txHashes.findMissingElements(elasticHashes);
      
      let gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.transactionGetService.tryGetTransactionFromGatewayForList(txHash)));
      for (let gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(gatewayTransaction);
        }
      }
    }

    if (queryOptions && queryOptions.withScResults) {
      // Add scResults to transaction details
      const sort = [timestamp];
      const elasticQueryAdapterSc = ElasticUtils.boilerplate(QueryConditionOptions.must, [], { from: 0, size: 10000 }, sort);
      elasticQueryAdapterSc.terms = new TermsQuery('originalTxHash', elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash));

      let scResults = await this.elasticService.getList('scresults', 'scHash', elasticQueryAdapterSc);
      for (let scResult of scResults) {
        scResult.hash = scResult.scHash;

        delete scResult.scHash;
      }

      const detailedTransactions: TransactionDetailed[] = [];
      for (let transaction of transactions) {
        const transactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), transaction);
        const transactionsScResults = scResults.filter(({originalTxHash}) => originalTxHash == transaction.txHash);
        transactionDetailed.results = transactionsScResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));

        detailedTransactions.push(transactionDetailed);
      }

      return detailedTransactions;
    }

    return transactions;
  }

  async getTransaction(txHash: string): Promise<TransactionDetailed | null> {
    let transaction = await this.transactionGetService.tryGetTransactionFromElastic(txHash);

    if (transaction === null) {
      transaction = await this.transactionGetService.tryGetTransactionFromGateway(txHash);
    }

    if (transaction !== null) {
      try {
        const [price, scamInfo] = await Promise.all([
          this.transactionPriceService.getTransactionPrice(transaction),
          this.getScamInfo(transaction),
        ]);

        transaction.price = price;
        transaction.scamInfo = scamInfo;
      } catch(error) {
        this.logger.error(`Error when fetching transaction price for transaction with hash '${txHash}'`);
        this.logger.error(error);
      }
    }

    return transaction;
  }

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult | string> {
    const receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver));
    const senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender));

    let txHash: string;
    try {
      let result = await this.gatewayService.create('transaction/send', transaction);
      txHash = result.txHash;
    } catch (error: any) {
      this.logger.error(error);
      return error.response.data.error;
    }

    // TODO: pending alignment
    return {
      txHash,
      receiver: transaction.receiver,
      sender: transaction.sender,
      receiverShard,
      senderShard,
      status: 'Pending',
    };
  }

  private async getScamInfo(transaction: TransactionDetailed): Promise<TransactionScamInfo | undefined> {
    let extrasApiUrl = this.apiConfigService.getExtrasApiUrl();
    if (!extrasApiUrl) {
      return undefined;
    }

    return await this.transactionScamCheckService.getScamInfo(transaction);
  }
}
