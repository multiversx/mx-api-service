import { Module } from "@nestjs/common";
import { VmQueryService } from "../vm.query.service";
import { AuctionContractService } from "./auction.contract.service";

@Module({
  providers: [
    AuctionContractService,
    VmQueryService,
  ],
  exports: [
    AuctionContractService,
  ],
})
export class AuctionContractModule { }
