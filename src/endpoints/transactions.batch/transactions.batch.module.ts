import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { TransactionModule } from "../transactions/transaction.module";
import { TransactionsBatchService } from "./transactions.batch.service";

@Module({
  imports: [
    DynamicModuleUtils.getCacheModule(),
    TransactionModule,
  ],
  providers: [
    TransactionsBatchService,
  ],
  exports: [
    TransactionsBatchService,
  ],
})
export class TransactionsBatchModule { }
