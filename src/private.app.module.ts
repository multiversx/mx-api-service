import { Module } from '@nestjs/common';
import { RemoteCacheController } from './endpoints/caching/remote.cache.controller';
import { ApiMetricsController } from './common/metrics/api.metrics.controller';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsPrivateController } from './endpoints/process-nfts/process.nfts.private.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { ApiMetricsModule } from './common/metrics/api.metrics.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ maxListeners: 1 }),
    LoggingModule,
    ProcessNftsModule,
    ApiMetricsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [
    ApiMetricsController,
    RemoteCacheController,
    HealthCheckController,
    ProcessNftsPrivateController,
  ],
})
export class PrivateAppModule { }
