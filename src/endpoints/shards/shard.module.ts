import { Module } from "@nestjs/common";
import { ProtocolModule } from "src/common/protocol/protocol.module";
import { NodeModule } from "../nodes/node.module";
import { ShardService } from "./shard.service";

@Module({
  imports: [
    NodeModule,
    ProtocolModule,
  ],
  providers: [
    ShardService,
  ],
  exports: [
    ShardService,
  ],
})
export class ShardModule { }
