import { AddressUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "../../utils/cache.info";
import { GatewayService } from "../gateway/gateway.service";
import { IndexerService } from "../indexer/indexer.service";
import { ApiConfigService } from "../api-config/api.config.service";
import { Address } from "@multiversx/sdk-core/out";

@Injectable()
export class ProtocolService {
  private readonly logger = new OriginLogger(ProtocolService.name);

  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CacheService))
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => IndexerService))
    private readonly indexerService: IndexerService,
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

  async getSecondsRemainingUntilNextRound(): Promise<number> {
    const genesisTimestamp = await this.getGenesisTimestamp();
    const currentTimestamp = Math.round(Date.now() / 1000);

    let result = 6 - (currentTimestamp - genesisTimestamp) % 6;
    if (result === 6) {
      result = 0;
    }

    return result;
  }

  private async getGenesisTimestamp(): Promise<number> {
    return await this.cachingService.getOrSet(
      CacheInfo.GenesisTimestamp.key,
      async () => await this.getGenesisTimestampRaw(),
      CacheInfo.GenesisTimestamp.ttl,
      CacheInfo.GenesisTimestamp.ttl,
    );
  }

  private async getGenesisTimestampRaw(): Promise<number> {
    try {
      const round = await this.indexerService.getRound(0, 1);
      return round.timestamp;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  async getShardIdForAddress(address: string): Promise<number | undefined> {
    if (!AddressUtils.isAddressValid(address)) {
      return undefined;
    }

    const shardCount = await this.getShardCount();
    const addressHex = new Address(address).hex();

    return AddressUtils.computeShard(addressHex, shardCount);
  }
}
