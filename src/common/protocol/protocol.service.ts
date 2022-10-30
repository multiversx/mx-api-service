import { OriginLogger } from "@elrondnetwork/erdnest";
import { CachingService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "../../utils/cache.info";
import { GatewayService } from "../gateway/gateway.service";
import { IndexerService } from "../indexer/indexer.service";

@Injectable()
export class ProtocolService {
  private readonly logger = new OriginLogger(ProtocolService.name);

  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => IndexerService))
    private readonly indexerService: IndexerService
  ) { }

  async getShardIds(): Promise<number[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NumShards.key,
      async () => await this.getShardIdsRaw(),
      CacheInfo.NumShards.ttl,
    );
  }

  private async getShardIdsRaw(): Promise<number[]> {
    const networkConfig = await this.gatewayService.getNetworkConfig();
    const shardCount = networkConfig.erd_num_shards_without_meta;

    const result = [];
    for (let i = 0; i < shardCount; i++) {
      result.push(i);
    }

    result.push(4294967295);
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
    return await this.cachingService.getOrSetCache(
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
}
