import { forwardRef, Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { AccountModule } from "../accounts/account.module";
import { BlockModule } from "../blocks/block.module";
import { EsdtModule } from "../esdt/esdt.module";
import { StakeModule } from "../stake/stake.module";
import { TransactionModule } from "../transactions/transaction.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NetworkService } from "./network.service";

@Module({
  imports: [
    VmQueryModule,
    forwardRef(() => BlockModule),
    forwardRef(() => AccountModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => StakeModule),
    forwardRef(() => EsdtModule),
    forwardRef(() => PluginModule),
  ],
  providers: [
    NetworkService,
  ],
  exports: [
    NetworkService,
  ],
})
export class NetworkModule { }
