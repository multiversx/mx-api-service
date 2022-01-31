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
import { SortOrder } from 'src/common/entities/sort.order';
import { TransactionUtils } from 'src/utils/transaction.utils';
import { BinaryUtils } from 'src/utils/binary.utils';

@Injectable()
export class TransactionService {
  private readonly logger: Logger;

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
    const queries: AbstractQuery[] = [];
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
      const search = BinaryUtils.base64Encode(filter.search);
      queries.push(QueryType.Wildcard('data', `*${search}*`));
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
    );
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

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    if (TransactionUtils.isTransactionCountQueryWithAddressOnly(filter, address)) {
      return this.getTransactionCountForAddress(address ?? '');
    }

    if (TransactionUtils.isTransactionCountQueryWithSenderAndReceiver(filter)) {
      return this.getTransactionCountForAddress(filter.sender ?? '');
    }

    const elasticQuery = this.buildTransactionFilterQuery(filter, address);

    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string): Promise<(Transaction | TransactionDetailed)[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.buildTransactionFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    const elasticTransactions = await this.elasticService.getList('transactions', 'txHash', elasticQuery);

    let transactions: (Transaction | TransactionDetailed)[] = [];

    for (const elasticTransaction of elasticTransactions) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), elasticTransaction);

      const tokenTransfer = this.tokenTransferService.getTokenTransfer(elasticTransaction);
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

      const gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.transactionGetService.tryGetTransactionFromGatewayForList(txHash)));
      for (const gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(gatewayTransaction);
        }
      }
    }

    if (queryOptions && (queryOptions.withScResults || queryOptions.withOperations) && elasticTransactions.some(x => x.hasScResults === true)) {
      transactions = await this.getExtraDetailsForTransactions(elasticTransactions, transactions, queryOptions);
    }

    for (const transaction of transactions) {
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

    const pluginTransaction = await this.pluginsService.processTransactionSend(transaction);
    if (pluginTransaction) {
      return pluginTransaction;
    }

    let txHash: string;
    try {
      const result = await this.gatewayService.create('transaction/send', GatewayComponentRequest.sendTransaction, transaction);
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

  private async getExtraDetailsForTransactions(elasticTransactions: any[], transactions: Transaction[], queryOptions: TransactionQueryOptions): Promise<TransactionDetailed[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
      .withTerms(new TermsQuery('originalTxHash', elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash)));

    const scResults = await this.elasticService.getList('scresults', 'scHash', elasticQuery);
    for (const scResult of scResults) {
      scResult.hash = scResult.scHash;

      delete scResult.scHash;
    }

    const hashes = [...transactions.map((transaction) => transaction.txHash), ...scResults.map((scResult) => scResult.hash)];
    const logs = await this.transactionGetService.getTransactionLogsFromElastic(hashes);

    const detailedTransactions: TransactionDetailed[] = [];
    for (const transaction of transactions) {
      const transactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), transaction);
      const transactionScResults = scResults.filter(({ originalTxHash }) => originalTxHash == transaction.txHash);

      if (queryOptions.withScResults) {
        transactionDetailed.results = transactionScResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
      }

      if (queryOptions.withOperations) {
        const transactionHashes: string[] = [transactionDetailed.txHash];
        for (const scResult of transactionScResults) {
          transactionHashes.push(scResult.hash);
        }
        const transactionLogsFromElastic = logs.filter((log) => transactionHashes.includes(log._id));
        const transactionLogs: TransactionLog[] = transactionLogsFromElastic.map(log => ApiUtils.mergeObjects(new TransactionLog(), log._source));
        transactionDetailed.operations = await this.tokenTransferService.getOperationsForTransactionLogs(transactionDetailed.txHash, transactionLogs);

        transactionDetailed.operations = TransactionUtils.trimOperations(transactionDetailed.operations);

        for (const log of transactionLogsFromElastic) {
          if (log._id === transactionDetailed.txHash) {
            transactionDetailed.logs = ApiUtils.mergeObjects(new TransactionLog(), log._source);
          }
          else {
            const foundScResult = transactionDetailed.results.find(({ hash }) => log._id === hash);
            if (foundScResult) {
              foundScResult.logs = ApiUtils.mergeObjects(new TransactionLog(), log._source);
            }
          }
        }
      }

      detailedTransactions.push(transactionDetailed);
    }

    return detailedTransactions;
  }
}
