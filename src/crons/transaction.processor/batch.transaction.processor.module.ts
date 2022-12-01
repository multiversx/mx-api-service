import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { TransactionsBatchModule } from "src/endpoints/transactions.batch/transactions.batch.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BatchTransactionProcessorService } from "./batch.transaction.processor.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApiConfigModule,
    DynamicModuleUtils.getCachingModule(),
    TransactionsBatchModule,
    TransactionModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    BatchTransactionProcessorService,
  ],
})
export class BatchTransactionProcessorModule { }
