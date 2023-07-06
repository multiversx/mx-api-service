import { forwardRef, Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { AccountModule } from "../accounts/account.module";
import { BlockModule } from "../blocks/block.module";
import { SmartContractResultModule } from "../sc-results/scresult.module";
import { StakeModule } from "../stake/stake.module";
import { TokenModule } from "../tokens/token.module";
import { TransactionModule } from "../transactions/transaction.module";
import { NetworkService } from "./network.service";
import { DelegationContractModule } from "../vm.query/contracts/delegation.contract.module";

@Module({
  imports: [
    forwardRef(() => TokenModule),
    forwardRef(() => BlockModule),
    forwardRef(() => AccountModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => StakeModule),
    forwardRef(() => PluginModule),
    forwardRef(() => SmartContractResultModule),
    forwardRef(() => DelegationContractModule),
  ],
  providers: [
    NetworkService,
  ],
  exports: [
    NetworkService,
  ],
})
export class NetworkModule { }
