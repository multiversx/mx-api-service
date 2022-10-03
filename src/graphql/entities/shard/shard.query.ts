import { Args, Resolver, Query } from "@nestjs/graphql";
import { ShardService } from "src/endpoints/shards/shard.service";
import { Shard } from "src/endpoints/shards/entities/shard";
import { GetShardInput } from "./shard.input";

@Resolver()
export class ShardsQuery {
  constructor(protected readonly shardService: ShardService) { }

  @Query(() => [Shard], { name: "shards", description: "Retrieve all shards for the given input." })
  public async getShards(@Args("input", { description: "Input to retrieve the given shards for." }) input: GetShardInput): Promise<Shard[]> {
    return await this.shardService.getShards(GetShardInput.resolve(input));
  }
}
