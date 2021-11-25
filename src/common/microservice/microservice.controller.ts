import { Controller, Logger } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { CachingService } from "../caching/caching.service";

@Controller()
export class MicroserviceController {
  private logger: Logger;
  constructor(
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(MicroserviceController.name);
   }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    for (let key of keys) {
      this.logger.log(`Deleting local cache key ${key}`);
      await this.cachingService.deleteInCacheLocal(key);
    }
  }

  @EventPattern('refreshCacheKey')
  async refreshCacheKey(info: { key: string, ttl: number }) {
    this.logger.log(`Refreshing local cache key ${info.key} with ttl ${info.ttl}`);
    await this.cachingService.refreshCacheLocal(info.key, info.ttl);
  }
}