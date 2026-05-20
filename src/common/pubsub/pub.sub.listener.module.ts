import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { PubSubListenerController } from './pub.sub.listener.controller';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';

@Module({
  imports: [
    DynamicModuleUtils.getCacheModule(),
    LoggingModule,
    ApiMetricsModule,
  ],
  controllers: [
    PubSubListenerController,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: ['PUBSUB_SERVICE'],
})
export class PubSubListenerModule { }
