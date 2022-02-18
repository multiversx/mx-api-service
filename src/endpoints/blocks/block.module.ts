import { Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { BlockService } from "./block.service";

@Module({
  imports: [
    BlsModule,
  ],
  providers: [
    BlockService,
  ],
  exports: [
    BlockService,
  ],
})
export class BlockModule { }
