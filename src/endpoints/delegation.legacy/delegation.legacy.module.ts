import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { DelegationLegacyController } from "./delegation.legacy.controller";
import { DelegationLegacyService } from "./delegation.legacy.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
  ],
  controllers: [
    DelegationLegacyController,
  ],
  providers: [
    DelegationLegacyService,
  ],
  exports: [
    DelegationLegacyService,
  ]
})
export class DelegationLegacyModule { }