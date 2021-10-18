import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { AccountModule } from "../accounts/account.module";
import { BlockModule } from "../blocks/block.module";
import { StakeModule } from "../stake/stake.module";
import { TransactionModule } from "../transactions/transaction.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { NetworkController } from "./network.controller";
import { NetworkService } from "./network.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => VmQueryModule),
    forwardRef(() => BlockModule),
    forwardRef(() => AccountModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => StakeModule),
  ],
  controllers: [
    NetworkController,
  ],
  providers: [
    NetworkService,
  ],
  exports: [
    NetworkService,
  ]
})
export class NetworkModule { }