import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryController } from "./vm.query.controller";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  controllers: [
    VmQueryController,
  ],
  providers: [
    VmQueryService
  ],
  exports: [
    VmQueryService
  ]
})
export class VmQueryModule { }