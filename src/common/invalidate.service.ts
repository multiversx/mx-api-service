import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CachingService } from "src/common/caching.service";

export class InvalidateService {
  constructor(
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  async invalidateKey(key: string, data: any, ttl: number) {
    await Promise.all([
      this.cachingService.setCache(key, data, ttl),
      this.deleteCacheKey(key),
    ]);
  }

  private async deleteCacheKey(key: string) {
    await this.clientProxy.emit('deleteCacheKeys', [ key ]);
  }
}