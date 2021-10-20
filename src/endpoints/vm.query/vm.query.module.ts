import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    VmQueryService
  ],
  exports: [
    VmQueryService
  ]
})
export class VmQueryModule { }