import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import { CachingService } from "src/helpers/caching.service";

@Controller()
export class CacheController {
  constructor(
    private readonly cachingService: CachingService
  ) {}

  @EventPattern('deleteCacheKeys')
  async deleteCacheKey(keys: string[]) {
    console.log(`Deleting cache keys ${keys}`);

    for (let key of keys) {
      await this.cachingService.deleteInCacheLocal(key);
    }
  }
}