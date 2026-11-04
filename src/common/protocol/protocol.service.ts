import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "../../utils/cache.info";
import { GatewayService } from "../gateway/gateway.service";
import { ApiConfigService } from "../api-config/api.config.service";
import { Address } from "@multiversx/sdk-core/out";

@Injectable()
export class ProtocolService {
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CacheService))
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async getShardIds(): Promise<number[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.ShardIds.key,
      async () => await this.getShardIdsRaw(),
      CacheInfo.ShardIds.ttl,
    );
  }

  async getShardCount(): Promise<number> {
    return await this.cachingService.getOrSet(
      CacheInfo.ShardCount.key,
      async () => await this.getShardCountRaw(),
      CacheInfo.ShardCount.ttl,
    );
  }

  private async getShardCountRaw(): Promise<number> {
    const networkConfig = await this.gatewayService.getNetworkConfig();
    const shardCount = networkConfig.erd_num_shards_without_meta;
    return shardCount;
  }

  async getRoundDurationMs(): Promise<number> {
    return await this.cachingService.getOrSet(
      CacheInfo.RoundDuration.key,
      async () => await this.getRoundDurationMsRaw(),
      CacheInfo.RoundDuration.ttl,
    );
  }

  private async getRoundDurationMsRaw(): Promise<number> {
    const networkConfig = await this.gatewayService.getNetworkConfig();
    return networkConfig.erd_round_duration;
  }

  private async getShardIdsRaw(): Promise<number[]> {
    const shardCount = await this.getShardCountRaw();
    const metaChainShardId = this.apiConfigService.getMetaChainShardId();

    const result = [];
    for (let i = 0; i < shardCount; i++) {
      result.push(i);
    }

    result.push(metaChainShardId);
    return result;
  }

  async getShardIdForAddress(address: string): Promise<number | undefined> {
    if (!AddressUtils.isAddressValid(address)) {
      return undefined;
    }

    const shardCount = await this.getShardCount();
    const addressHex = new Address(address).toHex();

    return AddressUtils.computeShard(addressHex, shardCount);
  }
}
