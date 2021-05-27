import { Controller, Delete, Param } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";

@Controller()
export class CacheController {
  constructor(
    private readonly cachingService: CachingService
  ) {}

  @Delete("/cache/:key")
  async deleteCacheKey(@Param('key') key: string) {
    console.log(`Deleting cache key ${key}`);
    await this.cachingService.deleteInCacheLocal(key);
  }
}