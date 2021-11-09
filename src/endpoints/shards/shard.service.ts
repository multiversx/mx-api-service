import { Injectable } from "@nestjs/common";
import { NodeService } from "../nodes/node.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { Shard } from "./entities/shard";
import { CachingService } from "src/common/caching/caching.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";

@Injectable()
export class ShardService {
  shards: Promise<number[]>;

  constructor(
    private readonly nodeService: NodeService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService
  ) { 
    this.shards = this.cachingService.getOrSetCache(
      CacheInfo.NumShards.key,
      async() => await this.gatewayService.getShards(),
      CacheInfo.NumShards.ttl
    );
  }

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

    const shards = [...new Set(validators.map(({ shard }) => shard).filter(shard => shard !== undefined).map(shard => shard!!))];

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
    return await Promise.all(
     (await this.shards).map(shard => this.getCurrentNonce(shard))
    );
  }

  async getLastProcessedNonces(): Promise<(number | undefined)[]> {
    return await Promise.all(
      (await this.shards).map(shard => this.getLastProcessedNonce(shard))
    );
  }
}