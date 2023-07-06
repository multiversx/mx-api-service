import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { DelegationContractService } from "./delegation.contract.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [
    DelegationContractService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    DelegationContractService,
  ],
})
export class DelegationContractModule { }
