import { Module } from "@nestjs/common";
import { AuctionContractModule } from "./auction.contract.module";
import { DelegationContractModule } from "./delegation.contract.module";
import { EsdtContractModule } from "./esdt.contract.module";
import { StakingContractModule } from "./staking.contract.module";
import { DelegationManagerContractModule } from "./delegation.manager.contract.module";

@Module({
  imports: [
    DelegationContractModule,
    AuctionContractModule,
    StakingContractModule,
    EsdtContractModule,
    DelegationManagerContractModule,
  ],
  exports: [
    DelegationContractModule,
    AuctionContractModule,
    StakingContractModule,
    EsdtContractModule,
    DelegationManagerContractModule,
  ],
})
export class ContractsModule { }
