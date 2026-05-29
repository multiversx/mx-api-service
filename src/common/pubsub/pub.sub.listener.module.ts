import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { PubSubListenerController } from './pub.sub.listener.controller';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ maxListeners: 1 }),
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
