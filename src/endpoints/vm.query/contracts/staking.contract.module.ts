import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { StakingContractService } from "./staking.contract.service";

@Module({
  providers: [
    StakingContractService,
    VmQueryService,
  ],
  exports: [
    StakingContractService,
  ],
})
export class StakingContractModule { }
