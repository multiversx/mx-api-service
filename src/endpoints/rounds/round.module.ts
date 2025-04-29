import { Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { RoundService } from "./round.service";
import { BlockModule } from "../blocks/block.module";

@Module({
  imports: [
    BlsModule,
    BlockModule,
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ],
})
export class RoundModule { }
