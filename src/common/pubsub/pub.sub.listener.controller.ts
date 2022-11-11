import { OriginLogger } from "@elrondnetwork/erdnest";
import { CachingService } from "@elrondnetwork/erdnest";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { WebSocketPublisherService } from "src/common/websockets/web-socket-publisher-service";

@Controller()
export class PubSubListenerController {
  private logger = new OriginLogger(PubSubListenerController.name);

  constructor(
    private readonly cachingService: CachingService,
    private readonly webSocketPublisherService: WebSocketPublisherService,
  ) { }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (const key of keys) {
      this.logger.log(`Deleting local cache key ${key}`);
      await this.cachingService.deleteInCacheLocal(key);
    }
  }

  @EventPattern('refreshCacheKey')
  async refreshCacheKey(info: { key: string, ttl: number }) {
    this.logger.log(`Refreshing local cache key ${info.key} with ttl ${info.ttl}`);
    await this.cachingService.refreshCacheLocal(info.key, info.ttl);
  }

  @EventPattern('transactionsCompleted')
  async transactionsCompleted(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionCompleted(transaction);
    }
  }

  @EventPattern('transactionsPendingResults')
  async transactionsPendingResults(transactions: ShardTransaction[]) {
    for (const transaction of transactions) {
      await this.webSocketPublisherService.onTransactionPendingResults(transaction);
    }
  }

  @EventPattern('onBatchUpdated')
  async onBatchUpdated(payload: { address: string, batchId: string, txHashes: string[] }) {
    this.logger.log(`Notifying batch updated for address ${payload.address}, batch id '${payload.batchId}', hashes ${payload.txHashes}`);
    await this.webSocketPublisherService.onBatchUpdated(payload.address, payload.batchId, payload.txHashes);
  }
}
