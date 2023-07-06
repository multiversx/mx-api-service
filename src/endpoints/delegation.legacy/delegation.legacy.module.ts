import { Module } from "@nestjs/common";
import { DelegationLegacyService } from "./delegation.legacy.service";
import { DelegationContractModule } from "../vm.query/contracts/delegation.contract.module";

@Module({
  imports: [
    DelegationContractModule,
  ],
  providers: [
    DelegationLegacyService,
  ],
  exports: [
    DelegationLegacyService,
  ],
})
export class DelegationLegacyModule { }
