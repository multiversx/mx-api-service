import { Module } from "@nestjs/common";
import { ShardResolver } from "./shard.resolver";
import { ShardModule as InternalShardModule } from "src/endpoints/shards/shard.module";

@Module({
  imports: [InternalShardModule],
  providers: [ShardResolver],
})
export class ShardModule { }
