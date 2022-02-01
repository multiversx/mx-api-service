import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { BlsModule } from "../bls/bls.module";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
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
