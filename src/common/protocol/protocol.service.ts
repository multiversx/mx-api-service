import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { CachingService } from "../caching/caching.service";
import { CacheInfo } from "../caching/entities/cache.info";
import { ElasticService } from "../elastic/elastic.service";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";

@Injectable()
export class ProtocolService {
  private readonly logger: Logger;
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => ElasticService))
    private readonly elasticService: ElasticService
  ) {
    this.logger = new Logger(ProtocolService.name);
  }

  async getShardIds(): Promise<number[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NumShards.key,
      async () => await this.getShardIdsRaw(),
      CacheInfo.NumShards.ttl,
    )
  }

  private async getShardIdsRaw(): Promise<number[]> {
    let networkConfig = await this.gatewayService.get('network/config', GatewayComponentRequest.networkConfig);
    let shardCount = networkConfig.config.erd_num_shards_without_meta;

    let result = [];
    for (let i = 0; i < shardCount; i++) {
      result.push(i);
    }

    result.push(4294967295);
    return result;
  }

  async getSecondsRemainingUntilNextRound(): Promise<number> {
    let genesisTimestamp = await this.getGenesisTimestamp();
    let currentTimestamp = Math.round(Date.now() / 1000);

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
      let round = await this.elasticService.getItem('rounds', 'round', `${0}_${1}`)
      return round.timestamp;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }
}