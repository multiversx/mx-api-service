import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { DelegationContractAddressService } from "./delegation.contract.address.service";

@Module({
  providers: [
    DelegationContractAddressService,
    VmQueryService,
  ],
  exports: [
    DelegationContractAddressService,
  ],
})
export class DelegationContractAddressModule { }
