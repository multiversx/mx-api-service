import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { DelegationContractService } from "./delegation.contract.service";

@Module({
  providers: [
    DelegationContractService,
    VmQueryService,
  ],
  exports: [
    DelegationContractService,
  ],
})
export class DelegationContractModule { }
