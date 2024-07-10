import { Injectable } from "@nestjs/common";
import { NodeService } from "../nodes/node.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { Shard } from "./entities/shard";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CacheInfo } from "src/utils/cache.info";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class ShardService {
  constructor(
    private readonly nodeService: NodeService,
    private readonly cachingService: CacheService,
  ) { }

  async getShards(queryPagination: QueryPagination): Promise<Shard[]> {
    const { from, size } = queryPagination;

    const allShards = await this.getAllShardsRaw();

    return allShards.slice(from, from + size);
  }

  async getAllShards(): Promise<Shard[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.ActiveShards.key,
      async () => await this.getAllShardsRaw(),
      CacheInfo.ActiveShards.ttl
    );
  }

  async getAllShardsRaw(): Promise<Shard[]> {
    const nodes = await this.nodeService.getAllNodes();

    const validators = nodes.filter(
      ({ type, shard, status }) =>
        type === 'validator' &&
        shard !== undefined &&
        [NodeStatus.eligible, NodeStatus.waiting].includes(status ?? NodeStatus.unknown)
    );

    const shards = validators.map(({ shard }) => shard).filter(shard => shard !== undefined).map(shard => shard ?? 0).distinct();

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
}
