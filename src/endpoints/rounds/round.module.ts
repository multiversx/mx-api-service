import { Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { RoundService } from "./round.service";

@Module({
  imports: [
    BlsModule,
  ],
  providers: [
    RoundService,
  ],
  exports: [
    RoundService,
  ],
})
export class RoundModule { }
