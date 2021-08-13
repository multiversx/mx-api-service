import { Controller, Logger } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { CachingService } from "src/common/caching.service";

@Controller()
export class CacheController {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService
  ) {
    this.logger = new Logger(CacheController.name);
  }

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    this.logger.log(`Deleting cache keys ${keys}`);

    for (let key of keys) {
      await this.cachingService.deleteInCacheLocal(key);
    }
  }
}