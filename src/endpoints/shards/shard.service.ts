import { Injectable } from "@nestjs/common";
import { NodeService } from "../nodes/node.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { Shard } from "./entities/shard";
import { CachingService } from "src/common/caching/caching.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { ProtocolService } from "src/common/protocol/protocol.service";

@Injectable()
export class ShardService {
  constructor(
    private readonly nodeService: NodeService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly protocolService: ProtocolService
  ) {}

  async getShards(queryPagination: QueryPagination): Promise<Shard[]> {
    const { from, size } = queryPagination;
    
    let allShards = await this.getAllShardsRaw();

    return allShards.slice(from, from + size);
  }

  async getAllShards(): Promise<Shard[]> {
    return this.cachingService.getOrSetCache(
      CacheInfo.ActiveShards.key,
      async () => await this.getAllShardsRaw(),
      CacheInfo.ActiveShards.ttl
    );
  }

  async getAllShardsRaw(): Promise<Shard[]> {
    let nodes = await this.nodeService.getAllNodes();

    const validators = nodes.filter(
      ({ type, shard, status }) =>
        type === 'validator' &&
        shard !== undefined &&
        [ NodeStatus.eligible, NodeStatus.waiting, NodeStatus.leaving ].includes(status ?? NodeStatus.unknown)
    );

    const shards = validators.map(({ shard }) => shard).filter(shard => shard !== undefined).map(shard => shard!!).distinct();

    return shards.map((shard) => {
      const shardValidators = validators.filter((node) => node.shard === shard);
      const activeShardValidators = shardValidators.filter(({ online }) => online);

      return {
        shard,
        validators: shardValidators.length,
        activeValidators: activeShardValidators.length,
      };
    });
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    let shardInfo = await this.gatewayService.get(`network/status/${shardId}`);
    return shardInfo.status.erd_nonce;
  }

  async getLastProcessedNonce(shardId: number): Promise<number | undefined> {
    return await this.cachingService.getCache<number>(CacheInfo.ShardNonce(shardId).key);
  }

  async setLastProcessedNonce(shardId: number, nonce: number): Promise<number> {
    return await this.cachingService.setCache<number>(CacheInfo.ShardNonce(shardId).key, nonce, CacheInfo.ShardNonce(shardId).ttl);
  }

  async getCurrentNonces(): Promise<number[]> {
    let shardIds = await this.protocolService.getShardIds();
    return await Promise.all(
     shardIds.map(shard => this.getCurrentNonce(shard))
    );
  }

  async getLastProcessedNonces(): Promise<(number | undefined)[]> {
    let shardIds = await this.protocolService.getShardIds();
    return await Promise.all(
      shardIds.map(shard => this.getLastProcessedNonce(shard))
    );
  }
}