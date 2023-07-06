import { Module } from "@nestjs/common";
import { KeysService } from "./keys.service";
import { StakingContractModule } from "../vm.query/contracts/staking.contract.module";

@Module({
  imports: [
    StakingContractModule,
  ],
  providers: [
    KeysService,
  ],
  exports: [
    KeysService,
  ],
})
export class KeysModule { }
