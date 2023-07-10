import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { AuctionContractService } from "./auction.contract.service";
import { ConfigService } from "@nestjs/config";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Module({
  providers: [
    AuctionContractService,
    VmQueryService,
    ApiConfigService,
    ConfigService,
  ],
  exports: [
    AuctionContractService,
  ],
})
export class AuctionContractModule { }
