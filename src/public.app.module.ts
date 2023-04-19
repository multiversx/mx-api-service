import { Module } from '@nestjs/common';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { GuestCachingService } from '@multiversx/sdk-nestjs-cache';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { LocalCacheController } from './endpoints/caching/local.cache.controller';
import { GraphQlModule } from './graphql/graphql.module';

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule.forRoot(),
    DynamicModuleUtils.getRedisCacheModule(),
    GraphQlModule.register(),
  ],
  controllers: [
    LocalCacheController,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    GuestCachingService,
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
