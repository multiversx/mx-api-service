import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { AuctionContractAddressService } from "./auction.contract.address.service";

@Module({
  providers: [
    AuctionContractAddressService,
    VmQueryService,
  ],
  exports: [
    AuctionContractAddressService,
  ],
})
export class AuctionContractAddressModule { }
