import { Module } from "@nestjs/common";
import { AuctionContractModule } from "./auction.contract.module";
import { DelegationContractModule } from "./delegation.contract.module";
import { EsdtContractModule } from "./esdt.contract.module";
import { StakingContractModule } from "./staking.contract.module";

@Module({
  imports: [
    DelegationContractModule,
    AuctionContractModule,
    StakingContractModule,
    EsdtContractModule,
  ],
  exports: [
    DelegationContractModule,
    AuctionContractModule,
    StakingContractModule,
    EsdtContractModule,
  ],
})
export class ContractsServiceModule { }
