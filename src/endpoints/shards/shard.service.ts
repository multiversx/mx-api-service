import { Injectable } from "@nestjs/common";
import { NodeService } from "../nodes/node.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { Shard } from "./entities/shard";
import { CachingService } from "src/helpers/caching.service";
import { oneMinute } from "src/helpers/helpers";

@Injectable()
export class ShardService {
  constructor(
    private readonly nodeService: NodeService,
    private readonly cachingService: CachingService
  ) {}

  async getShards(from: number, size: number): Promise<Shard[]> {
    let allShards = await this.getAllShardsRaw();

    return allShards.slice(from, size);
  }

  async getAllShards(): Promise<Shard[]> {
    return this.cachingService.getOrSetCache(
      'shards',
      async () => await this.getAllShardsRaw(),
      oneMinute()
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
}