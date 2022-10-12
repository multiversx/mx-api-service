import { Resolver } from "@nestjs/graphql";
import { ShardsQuery } from "./shard.query";
import { Shard } from "src/endpoints/shards/entities/shard";
import { ShardService } from "src/endpoints/shards/shard.service";

@Resolver(() => Shard)
export class ShardResolver extends ShardsQuery {
  constructor(shardService: ShardService) {
    super(shardService);
  }
}
