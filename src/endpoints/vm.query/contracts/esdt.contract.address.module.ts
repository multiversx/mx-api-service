import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { EsdtContractAddressService } from "./esdt.contract.address.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [
    EsdtContractAddressService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    EsdtContractAddressService,
  ],
})
export class EsdtContractAddressModule { }
