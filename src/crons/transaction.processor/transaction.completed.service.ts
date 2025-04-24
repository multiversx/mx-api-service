import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { LogMetricsEvent } from "src/common/entities/log.metrics.event";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { TransactionProcessor } from "@multiversx/sdk-transaction-processor";
import { LogTopic } from "@multiversx/sdk-transaction-processor/lib/types/log-topic";

@Injectable()
export class TransactionCompletedService {
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();
  private isProcessing = false;
  private readonly logger: Logger = new Logger(TransactionCompletedService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly eventEmitter: EventEmitter2,
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
          const transactionsExcludingSmartContractResults = transactions.filter(transaction => !transaction.originalTransactionHash);

          const cacheKeys = transactionsExcludingSmartContractResults.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).key);
          const hashes: string[] = await this.cachingService.batchGetManyRemote(cacheKeys) as string[];
          const validHashes = hashes.filter(x => x !== null);
          if (validHashes.length > 0) {
            const keys = validHashes.map(hash => CacheInfo.TransactionPendingResults(hash).key);

            await this.cachingService.batchDelCache(keys);
          }

          this.logger.log(`Transactions completed: ${transactionsExcludingSmartContractResults.map(x => x.hash).join(', ')}`);
          this.clientProxy.emit('transactionsCompleted', transactionsExcludingSmartContractResults);
        },
        onTransactionsPending: async (_, __, transactions) => {
          await this.cachingService.batchSet(
            transactions.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).key),
            transactions.map(transaction => transaction.hash),
            transactions.map(transaction => CacheInfo.TransactionPendingResults(transaction.hash).ttl),
            false,
            false,
          );

          this.clientProxy.emit('transactionsPendingResults', transactions);
        },
        getLastProcessedNonce: async (shardId) => {
          return await this.cachingService.get<number>(CacheInfo.TransactionCompletedShardNonce(shardId).key);
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          const event = new LogMetricsEvent();
          event.args = [shardId, nonce];
          this.eventEmitter.emit(
            MetricsEvents.SetLastProcessedTransactionCompletedProcessorNonce,
            event
          );

          await this.cachingService.set<number>(CacheInfo.TransactionCompletedShardNonce(shardId).key, nonce, CacheInfo.TransactionCompletedShardNonce(shardId).ttl);
        },
        onMessageLogged: (topic, message) => {
          const logLevel = this.apiConfigService.getTransactionCompletedLogLevel();
          if (topic === LogTopic.CrossShardSmartContractResult && [LogTopic.Error].includes(logLevel)) {
            return;
          } else if (topic === LogTopic.Debug && [LogTopic.Error, LogTopic.CrossShardSmartContractResult].includes(logLevel)) {
            return;
          }

          this.logger.log(`[${topic}] ${message}`);
        },
      });
    } finally {
      this.isProcessing = false;
    }
  }
}
