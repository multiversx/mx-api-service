import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ConfigService } from "@nestjs/config";
import { DelegationManagerContractService } from "./delegation.manager.contract.service";

@Module({
  providers: [
    DelegationManagerContractService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    DelegationManagerContractService,
  ],
})
export class DelegationManagerContractModule { }
