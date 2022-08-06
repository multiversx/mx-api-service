import { Module } from '@nestjs/common';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/date.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/number.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { LoggingModule } from '@elrondnetwork/erdnest';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { LocalCacheController } from './endpoints/caching/local.cache.controller';

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule,
  ],
  controllers: [
    LocalCacheController,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
