import { Module } from "@nestjs/common";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { DelegationLegacyService } from "./delegation.legacy.service";

@Module({
  imports: [
    VmQueryModule,
  ],
  providers: [
    DelegationLegacyService,
  ],
  exports: [
    DelegationLegacyService,
  ],
})
export class DelegationLegacyModule { }
