import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { TransactionCompletedService } from './transaction.completed.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApiConfigModule,
    DynamicModuleUtils.getCachingModule(),
    TransactionModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    TransactionCompletedService,
  ],
})
export class TransactionCompletedModule { }
