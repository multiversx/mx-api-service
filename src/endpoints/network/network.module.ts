import { forwardRef, Module } from "@nestjs/common";
import { AccountModule } from "../accounts/account.module";
import { BlockModule } from "../blocks/block.module";
import { StakeModule } from "../stake/stake.module";
import { TransactionModule } from "../transactions/transaction.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NetworkService } from "./network.service";

@Module({
  imports: [
    VmQueryModule,
    BlockModule,
    forwardRef(() => AccountModule),
    TransactionModule,
    forwardRef(() => StakeModule),
  ],
  providers: [
    NetworkService,
  ],
  exports: [
    NetworkService,
  ],
})
export class NetworkModule { }
