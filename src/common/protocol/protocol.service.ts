import { Injectable } from "@nestjs/common";
import { CachingService } from "../caching/caching.service";
import { CacheInfo } from "../caching/entities/cache.info";
import { GatewayService } from "../gateway/gateway.service";

@Injectable()
export class ProtocolService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
  ) {}

  async getNumShards(): Promise<number[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NumShards.key,
      async () => await this.getNumShardsRaw(),
      CacheInfo.NumShards.ttl,
    )
  }

  private async getNumShardsRaw(): Promise<number[]> {
    let networkConfig = await this.gatewayService.get('network/config');
    let shardCount = networkConfig.config.erd_num_shards_without_meta;

    let result = [];
    for (let i = 0; i < shardCount; i++) {
      result.push(i);
    }

    result.push(4294967295);
    return result;
  }
}