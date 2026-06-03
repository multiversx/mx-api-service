import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { TransactionsBatchModule } from "src/endpoints/transactions.batch/transactions.batch.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BatchTransactionProcessorService } from "./batch.transaction.processor.service";
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PersistenceModule } from "src/common/persistence/persistence.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ maxListeners: 1 }),
    PersistenceModule.forRoot(),
    ApiConfigModule,
    DynamicModuleUtils.getCacheModule(),
    TransactionsBatchModule,
    TransactionModule,
    ApiMetricsModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    BatchTransactionProcessorService,
  ],
})
export class BatchTransactionProcessorModule { }
