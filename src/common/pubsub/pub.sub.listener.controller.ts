import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";

@Controller()
export class PubSubListenerController {
  private logger = new OriginLogger(PubSubListenerController.name);

  constructor(
    private readonly cachingService: CacheService
  ) { }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (const key of keys) {
      this.logger.log(`Deleting local cache key ${key}`);
      await this.cachingService.deleteLocal(key);
    }
  }

  @EventPattern('refreshCacheKey')
  async refreshCacheKey(info: { key: string, ttl: number }) {
    this.logger.log(`Refreshing local cache key ${info.key} with ttl ${info.ttl}`);
    await this.cachingService.refreshLocal(info.key, info.ttl);
  }
}
