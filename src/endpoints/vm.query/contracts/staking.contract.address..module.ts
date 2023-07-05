import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { StakingContractAddressService } from "./staking.contract.address.service";

@Module({
  providers: [
    StakingContractAddressService,
    VmQueryService,
  ],
  exports: [
    StakingContractAddressService,
  ],
})
export class StakingContractAddressModule { }
