import { Module } from '@nestjs/common';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { GuestCacheService } from '@multiversx/sdk-nestjs-cache';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { LocalCacheController } from './endpoints/caching/local.cache.controller';
import { RestrictedRoutesMiddleware } from './utils/restricted.routes.middleware';
import { ApiMetricsModule } from './common/metrics/api.metrics.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // for plugins, best practice not to have crons in public API
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule.forRoot(),
    DynamicModuleUtils.getRedisCacheModule(),
    ApiMetricsModule,
  ],
  controllers: [
    LocalCacheController,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    GuestCacheService,
    RestrictedRoutesMiddleware,
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
