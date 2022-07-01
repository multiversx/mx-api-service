import { Module } from '@nestjs/common';
import '@elrondnetwork/erdnest/lib/utils/extensions/array.extensions';
import '@elrondnetwork/erdnest/lib/utils/extensions/date.extensions';
import '@elrondnetwork/erdnest/lib/utils/extensions/number.extensions';
import '@elrondnetwork/erdnest/lib/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { LoggingModule } from '@elrondnetwork/erdnest';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
