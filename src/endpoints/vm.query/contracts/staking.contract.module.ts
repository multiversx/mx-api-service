import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { StakingContractService } from "./staking.contract.service";
import { ConfigService } from "@nestjs/config";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Module({
  providers: [
    StakingContractService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    StakingContractService,
  ],
})
export class StakingContractModule { }
