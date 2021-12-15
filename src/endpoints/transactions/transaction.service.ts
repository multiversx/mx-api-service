import { Injectable, Logger } from '@nestjs/common';
import { QueryConditionOptions } from 'src/common/elastic/entities/query.condition.options';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionSendResult } from './entities/transaction.send.result';
import { QueryOperator } from 'src/common/elastic/entities/query.operator';
import { TransactionGetService } from './transaction.get.service';
import { TokenTransferService } from '../tokens/token.transfer.service';
import { TransactionPriceService } from './transaction.price.service';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { SmartContractResult } from '../sc-results/entities/smart.contract.result';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { TransactionLog } from './entities/transaction.log';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ElasticService } from 'src/common/elastic/elastic.service';
import { ElasticQuery } from 'src/common/elastic/entities/elastic.query';
import { AbstractQuery } from 'src/common/elastic/entities/abstract.query';
import { QueryType } from 'src/common/elastic/entities/query.type';
import { ElasticSortProperty } from 'src/common/elastic/entities/elastic.sort.property';
import { ElasticSortOrder } from 'src/common/elastic/entities/elastic.sort.order';
import { TermsQuery } from 'src/common/elastic/entities/terms.query';
import { PluginService } from 'src/common/plugins/plugin.service';
import { CachingService } from 'src/common/caching/caching.service';
import { CacheInfo } from 'src/common/caching/entities/cache.info';
import { Constants } from 'src/utils/constants';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';

@Injectable()
export class TransactionService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly transactionPriceService: TransactionPriceService,
    private readonly transactionGetService: TransactionGetService,
    private readonly tokenTransferService: TokenTransferService,
    private readonly pluginsService: PluginService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private buildTransactionFilterQuery(filter: TransactionFilter, address?: string): ElasticQuery {
    let queries: AbstractQuery[] = [];
    let shouldQueries: AbstractQuery[] = [];
    let mustQueries: AbstractQuery[] = [];

    if (address) {
      shouldQueries.push(QueryType.Match('sender', address));
      shouldQueries.push(QueryType.Match('receiver', address));
    }

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
      queries.push(QueryType.Should(filter.hashes.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      queries.push(QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      queries.push(QueryType.Wildcard('data', `*${filter.search}*`));
    }

    if (filter.condition === QueryConditionOptions.should) {
      shouldQueries = [...shouldQueries, ...queries];
    } else {
      mustQueries = queries;
    }

    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.must, mustQueries);


    if (filter.before || filter.after) {
      elasticQuery = elasticQuery
        .withFilter([QueryType.Range('timestamp', filter.before ?? Date.now(), filter.after ?? 0)]);
    }

    return elasticQuery;
  }

  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.TxCount(address).key,
      async () => await this.getTransactionCountForAddressRaw(address),
      CacheInfo.TxCount(address).ttl,
      Constants.oneSecond(),
    )
  }

  async getTransactionCountForAddressRaw(address: string): Promise<number> {
    const queries = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ];
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  private isTransactionCountQueryWithAddressOnly(filter: TransactionFilter, address?: string) {
    if (!address) {
      return false;
    }

    let filterToCompareWith: TransactionFilter = {};

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }

  private isTransactionCountQueryWithSenderAndReceiver(filter: TransactionFilter) {
    if (!filter.sender || !filter.receiver) {
      return false;
    }

    if (filter.sender !== filter.receiver) {
      return false;
    }

    let filterToCompareWith: TransactionFilter = {
      sender: filter.sender,
      receiver: filter.receiver,
      condition: QueryConditionOptions.should,
    };

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    if (this.isTransactionCountQueryWithAddressOnly(filter, address)) {
      return this.getTransactionCountForAddress(address ?? '');
    }

    if (this.isTransactionCountQueryWithSenderAndReceiver(filter)) {
      return this.getTransactionCountForAddress(filter.sender ?? '');
    }

    let elasticQuery = this.buildTransactionFilterQuery(filter, address);

    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string): Promise<(Transaction | TransactionDetailed)[]> {
    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descending };
    const nonce: ElasticSortProperty = { name: 'nonce', order: ElasticSortOrder.descending };

    let elasticQuery = this.buildTransactionFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    let elasticTransactions = await this.elasticService.getList('transactions', 'txHash', elasticQuery);

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
      const txHashes: string[] = filter.hashes;
      const elasticHashes = elasticTransactions.map(({ txHash }) => txHash);
      const missingHashes: string[] = txHashes.findMissingElements(elasticHashes);

      let gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.transactionGetService.tryGetTransactionFromGatewayForList(txHash)));
      for (let gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(gatewayTransaction);
        }
      }
    }

    if (queryOptions && (queryOptions.withScResults || queryOptions.withOperations) && elasticTransactions.some(x => x.hasScResults === true)) {
      // Add scResults to transaction details

      const elasticQuery = ElasticQuery.create()
        .withPagination({ from: 0, size: 10000 })
        .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
        .withTerms(new TermsQuery('originalTxHash', elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash)));

      let scResults = await this.elasticService.getList('scresults', 'scHash', elasticQuery);
      for (let scResult of scResults) {
        scResult.hash = scResult.scHash;

        delete scResult.scHash;
      }

      const detailedTransactions: TransactionDetailed[] = [];
      for (let transaction of transactions) {
        const transactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), transaction);
        const transactionsScResults = scResults.filter(({ originalTxHash }) => originalTxHash == transaction.txHash);

        if (queryOptions.withScResults) {
          transactionDetailed.results = transactionsScResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
        }

        if (queryOptions.withOperations) {
          const hashes: string[] = [transactionDetailed.txHash];
          for (let scResult of transactionsScResults) {
            hashes.push(scResult.hash);
          }
          const logs = await this.transactionGetService.getTransactionLogsFromElastic(hashes);
          let transactionLogs: TransactionLog[] = logs.map(log => ApiUtils.mergeObjects(new TransactionLog(), log._source));
          transactionDetailed.operations = await this.tokenTransferService.getOperationsForTransactionLogs(transactionDetailed.txHash, transactionLogs);

          transactionDetailed.operations = this.transactionGetService.trimOperations(transactionDetailed.operations);
        }

        detailedTransactions.push(transactionDetailed);
      }

      transactions = detailedTransactions;
    }

    for (let transaction of transactions) {
      await this.processTransaction(transaction);
    }

    return transactions;
  }

  async getTransaction(txHash: string, fields?: string[]): Promise<TransactionDetailed | null> {
    let transaction = await this.transactionGetService.tryGetTransactionFromElastic(txHash, fields);

    if (transaction === null) {
      transaction = await this.transactionGetService.tryGetTransactionFromGateway(txHash);
    }

    if (transaction !== null) {
      const [price] = await Promise.all([
        this.getTransactionPrice(transaction),
        this.processTransaction(transaction),
      ]);
      transaction.price = price;
    }

    return transaction;
  }

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult | string> {
    const receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver));
    const senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender));

    let pluginTransaction = await this.pluginsService.processTransactionSend(transaction);
    if (pluginTransaction) {
      return pluginTransaction;
    }

    let txHash: string;
    try {
      let result = await this.gatewayService.create('transaction/send', GatewayComponentRequest.sendTransaction, transaction);
      txHash = result.txHash;
    } catch (error: any) {
      this.logger.error(error);
      return error.response.error;
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

  private async getTransactionPrice(transaction: TransactionDetailed): Promise<number | undefined> {
    try {
      return await this.transactionPriceService.getTransactionPrice(transaction);
    } catch (error) {
      this.logger.error(`Error when fetching transaction price for transaction with hash '${transaction.txHash}'`);
      this.logger.error(error);
      return;
    }
  }

  private async processTransaction(transaction: Transaction | TransactionDetailed): Promise<void> {
    try {
      await this.pluginsService.processTransaction(transaction);
    } catch (error) {
      this.logger.error(`Unhandled error when processing plugin transaction for transaction with hash '${transaction.txHash}'`);
      this.logger.error(error);
    }
  }
}
