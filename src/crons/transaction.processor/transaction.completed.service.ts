import { TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";

@Injectable()
export class TransactionCompletedService {
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();
  private isProcessing = false;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @Cron('*/1 * * * * *')
  async handleNewTransactions() {
    if (this.isProcessing) {
      return;
    }

    try {
      await this.transactionProcessor.start({
        gatewayUrl: this.apiConfigService.getGatewayUrl(),
        maxLookBehind: this.apiConfigService.getTransactionCompletedMaxLookBehind(),
        waitForFinalizedCrossShardSmartContractResults: true,
        onTransactionsReceived: async (_, __, transactions) => {
          const hashes: string[] = await this.cachingService.batchGetCacheRemote(transactions.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).key));
          const validHashes = hashes.filter(x => x !== null);
          if (validHashes.length > 0) {
            const keys = validHashes.map(hash => CacheInfo.TransactionPendingResults(hash).key);

            await this.cachingService.batchDelCache(keys);
          }

          this.clientProxy.emit('transactionsCompleted', transactions);
        },
        onTransactionsPending: async (_, __, transactions) => {
          await this.cachingService.batchSetCache(
            transactions.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).key),
            transactions.map(transaction => transaction.hash),
            transactions.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).ttl)
          );

          this.clientProxy.emit('transactionsPendingResults', transactions);
        },
        getLastProcessedNonce: async (shardId) => {
          return await this.cachingService.getCache<number>(CacheInfo.TransactionCompletedShardNonce(shardId).key);
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          await this.cachingService.setCache<number>(CacheInfo.TransactionCompletedShardNonce(shardId).key, nonce, CacheInfo.TransactionCompletedShardNonce(shardId).ttl);
        },
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
