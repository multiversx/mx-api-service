import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Controller, Logger } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { WebSocketPublisherService } from "src/websockets/web-socket-publisher-service";
import { CachingService } from "../caching/caching.service";

@Controller()
export class PubSubListenerController {
  private logger: Logger;
  constructor(
    private readonly cachingService: CachingService,
    private readonly webSocketPublisherService: WebSocketPublisherService,
  ) {
    this.logger = new Logger(PubSubListenerController.name);
  }

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
}
