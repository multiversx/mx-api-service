import { Module } from '@nestjs/common';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { GuestCachingService, LoggingModule } from '@multiversx/sdk-nestjs';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { LocalCacheController } from './endpoints/caching/local.cache.controller';
import { GraphQlModule } from './graphql/graphql.module';

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule.forRoot(),
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
