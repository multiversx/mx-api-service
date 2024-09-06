import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { TransactionCompletedService } from './transaction.completed.service';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { GatewayModule } from 'src/common/gateway/gateway.module';
import { ProtocolModule } from 'src/common/protocol/protocol.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApiConfigModule,
    ApiMetricsModule,
    GatewayModule,
    ProtocolModule,
    DynamicModuleUtils.getCacheModule(),
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    TransactionCompletedService,
  ],
})
export class TransactionCompletedModule { }
