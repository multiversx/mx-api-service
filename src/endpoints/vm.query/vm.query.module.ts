import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { GENESIS_TIMESTAMP_SERVICE } from "src/utils/genesis.timestamp.interface";
import { BlsModule } from "../bls/bls.module";
import { RoundService } from "../rounds/round.service";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    BlsModule,
  ],
  providers: [
    {
      useClass: RoundService,
      provide: GENESIS_TIMESTAMP_SERVICE
    },
    VmQueryService
  ],
  exports: [
    VmQueryService
  ]
})
export class VmQueryModule { }