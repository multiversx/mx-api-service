import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionSendResult } from './entities/transaction.send.result';
import { TransactionGetService } from './transaction.get.service';
import { TokenTransferService } from '../tokens/token.transfer.service';
import { TransactionPriceService } from './transaction.price.service';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { SmartContractResult } from '../sc-results/entities/smart.contract.result';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { TransactionLog } from './entities/transaction.log';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { PluginService } from 'src/common/plugins/plugin.service';
import { CacheInfo } from 'src/utils/cache.info';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';
import { SortOrder } from 'src/common/entities/sort.order';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { TransactionActionService } from './transaction-action/transaction.action.service';
import { TransactionDecodeDto } from './entities/dtos/transaction.decode.dto';
import { TransactionStatus } from './entities/transaction.status';
import { AddressUtils, ApiUtils, Constants, CachingService, ElasticQuery, QueryOperator, QueryType, QueryConditionOptions, ElasticSortOrder, ElasticSortProperty, TermsQuery } from '@elrondnetwork/erdnest';
import { TransactionUtils } from './transaction.utils';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';

@Injectable()
export class TransactionService {
  private readonly logger: Logger;

  constructor(
    private readonly indexerService: ElasticIndexerService,
    private readonly gatewayService: GatewayService,
    private readonly transactionPriceService: TransactionPriceService,
    @Inject(forwardRef(() => TransactionGetService))
    private readonly transactionGetService: TransactionGetService,
    @Inject(forwardRef(() => TokenTransferService))
    private readonly tokenTransferService: TokenTransferService,
    private readonly pluginsService: PluginService,
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => TransactionActionService))
    private readonly transactionActionService: TransactionActionService
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private buildTransactionFilterQuery(filter: TransactionFilter, address?: string): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withMustMatchCondition('tokens', filter.token, QueryOperator.AND)
      .withMustMatchCondition('function', this.apiConfigService.getIsIndexerV3FlagActive() ? filter.function : undefined)
      .withMustMatchCondition('senderShard', filter.senderShard)
      .withMustMatchCondition('receiverShard', filter.receiverShard)
      .withMustMatchCondition('miniBlockHash', filter.miniBlockHash)
      .withMustMultiShouldCondition(filter.hashes, hash => QueryType.Match('_id', hash))
      .withMustMatchCondition('status', filter.status)
      .withMustWildcardCondition('data', filter.search)
      .withMustMultiShouldCondition(filter.tokens, token => QueryType.Match('tokens', token, QueryOperator.AND))
      .withDateRangeFilter('timestamp', filter.before, filter.after);

    if (filter.condition === QueryConditionOptions.should) {
      if (filter.sender) {
        elasticQuery = elasticQuery.withShouldCondition(QueryType.Match('sender', filter.sender));
      }

      if (filter.receiver) {
        elasticQuery = elasticQuery.withShouldCondition(QueryType.Match('receiver', filter.receiver));

        if (this.apiConfigService.getIsIndexerV3FlagActive()) {
          elasticQuery = elasticQuery.withShouldCondition(QueryType.Match('receivers', filter.receiver));
        }
      }
    } else {
      elasticQuery = elasticQuery.withMustMatchCondition('sender', filter.sender);

      if (filter.receiver) {
        const keys = ['receiver'];
        if (this.apiConfigService.getIsIndexerV3FlagActive()) {
          keys.push('receivers');
        }

        elasticQuery = elasticQuery.withMustMultiShouldCondition(keys, key => QueryType.Match(key, filter.receiver));
      }
    }

    if (address) {
      const keys: string[] = ['sender', 'receiver'];

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        keys.push('receivers');
      }

      elasticQuery = elasticQuery.withMustMultiShouldCondition(keys, key => QueryType.Match(key, address));
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

    return await this.indexerService.getCount('transactions', elasticQuery);
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    if (TransactionUtils.isTransactionCountQueryWithAddressOnly(filter, address)) {
      return this.getTransactionCountForAddress(address ?? '');
    }

    if (TransactionUtils.isTransactionCountQueryWithSenderAndReceiver(filter)) {
      return this.getTransactionCountForAddress(filter.sender ?? '');
    }

    const elasticQuery = this.buildTransactionFilterQuery(filter, address);

    return await this.indexerService.getCount('transactions', elasticQuery);
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string): Promise<Transaction[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.buildTransactionFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    const elasticTransactions = await this.indexerService.getList('transactions', 'txHash', elasticQuery);

    let transactions: Transaction[] = [];

    for (const elasticTransaction of elasticTransactions) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), elasticTransaction);

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

      if (transaction.pendingResults === true && transaction.results) {
        for (const result of transaction.results) {
          if (!result.logs || !result.logs.events) {
            continue;
          }

          for (const event of result.logs.events) {
            if (event.identifier === 'completedTxEvent') {
              transaction.pendingResults = undefined;
            }
          }
        }
      }
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
      // eslint-disable-next-line require-await
      const result = await this.gatewayService.create('transaction/send', GatewayComponentRequest.sendTransaction, transaction, async (error) => {
        const message = error.response?.data?.error;
        if (message && message.includes('transaction generation failed')) {
          throw error;
        }

        return false;
      });

      txHash = result?.txHash;
    } catch (error: any) {
      return error.response?.error ?? '';
    }

    return {
      txHash,
      receiver: transaction.receiver,
      sender: transaction.sender,
      receiverShard,
      senderShard,
      status: 'Pending',
    };
  }

  async decodeTransaction(transactionDecode: TransactionDecodeDto): Promise<TransactionDecodeDto> {
    const transaction = ApiUtils.mergeObjects(new Transaction(), { ...transactionDecode });
    transactionDecode.action = await this.transactionActionService.getTransactionAction(transaction);

    return transactionDecode;
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

  async processTransaction(transaction: Transaction): Promise<void> {
    try {
      await this.pluginsService.processTransaction(transaction);

      transaction.action = await this.transactionActionService.getTransactionAction(transaction);
      transaction.pendingResults = await this.getPendingResults(transaction);

      if (transaction.pendingResults === true) {
        transaction.status = TransactionStatus.pending;
      }
    } catch (error) {
      this.logger.error(`Unhandled error when processing plugin transaction for transaction with hash '${transaction.txHash}'`);
      this.logger.error(error);
    }
  }

  private async getPendingResults(transaction: Transaction): Promise<boolean | undefined> {
    const twentyMinutes = Constants.oneMinute() * 20 * 1000;
    const timestampLimit = (new Date().getTime() - twentyMinutes) / 1000;
    if (transaction.timestamp < timestampLimit) {
      return undefined;
    }

    const pendingResult = await this.cachingService.getCache(CacheInfo.TransactionPendingResults(transaction.txHash).key);
    if (!pendingResult) {
      return undefined;
    }

    return true;
  }

  private async getExtraDetailsForTransactions(elasticTransactions: any[], transactions: Transaction[], queryOptions: TransactionQueryOptions): Promise<TransactionDetailed[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
      .withTerms(new TermsQuery('originalTxHash', elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash)));

    const scResults = await this.indexerService.getList('scresults', 'scHash', elasticQuery);
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
        const previousHashes: Record<string, string> = {};
        for (const scResult of transactionScResults) {
          transactionHashes.push(scResult.hash);
          previousHashes[scResult.hash] = scResult.prevTxHash;
        }

        const transactionLogs: TransactionLog[] = logs.filter((log) => transactionHashes.includes(log.id ?? ''));

        transactionDetailed.operations = await this.tokenTransferService.getOperationsForTransaction(transactionDetailed, transactionLogs);
        transactionDetailed.operations = TransactionUtils.trimOperations(transactionDetailed.sender, transactionDetailed.operations, previousHashes);

        for (const log of logs) {
          if (log.id === transactionDetailed.txHash) {
            transactionDetailed.logs = log;
          } else {
            const foundScResult = transactionDetailed.results.find(({ hash }) => log.id === hash);
            if (foundScResult) {
              foundScResult.logs = log;
            }
          }
        }
      }

      detailedTransactions.push(transactionDetailed);
    }

    return detailedTransactions;
  }
}
