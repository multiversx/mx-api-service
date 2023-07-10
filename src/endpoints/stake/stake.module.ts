import { forwardRef, Module } from "@nestjs/common";
import { NetworkModule } from "../network/network.module";
import { NodeModule } from "../nodes/node.module";
import { StakeService } from "./stake.service";
import { StakingContractModule } from "../vm.query/contracts/staking.contract.module";
import { AuctionContractModule } from "../vm.query/contracts/auction.contract.module";

@Module({
  imports: [
    forwardRef(() => NodeModule),
    forwardRef(() => NetworkModule),
    StakingContractModule,
    AuctionContractModule,
  ],
  providers: [
    StakeService,
  ],
  exports: [
    StakeService,
  ],
})
export class StakeModule { }
