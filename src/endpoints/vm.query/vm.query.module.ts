import { Module } from "@nestjs/common";
import { BlsModule } from "../bls/bls.module";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    BlsModule,
  ],
  providers: [
    VmQueryService,
  ],
  exports: [
    VmQueryService,
  ],
})
export class VmQueryModule { }
