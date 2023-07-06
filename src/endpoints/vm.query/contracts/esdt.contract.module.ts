import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { EsdtContractService } from "./esdt.contract.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [
    EsdtContractService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    EsdtContractService,
  ],
})
export class EsdtContractModule { }
