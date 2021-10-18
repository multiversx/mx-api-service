import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { NodeModule } from "../nodes/node.module";
import { ShardController } from "./shard.controller";
import { ShardService } from "./shard.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => NodeModule),
  ],
  controllers: [
    ShardController,
  ],
  providers: [
    ShardService,
  ],
  exports: [
    ShardService,
  ]
})
export class ShardModule { }