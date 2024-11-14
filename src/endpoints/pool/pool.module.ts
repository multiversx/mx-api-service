import { Module } from "@nestjs/common";
import { PoolService } from "./pool.service";
import { ProtocolModule } from "../../common/protocol/protocol.module";

@Module({
  imports: [
    ProtocolModule,
  ],
  providers: [
    PoolService,
  ],
  exports: [
    PoolService,
  ],
})

export class PoolModule { }
