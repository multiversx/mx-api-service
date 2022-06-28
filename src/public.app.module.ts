import { Module } from '@nestjs/common';
import '@elrondnetwork/nestjs-microservice-common/lib/src/utils/extensions/array.extensions';
import '@elrondnetwork/nestjs-microservice-common/lib/src/utils/extensions/date.extensions';
import '@elrondnetwork/nestjs-microservice-common/lib/src/utils/extensions/number.extensions';
import '@elrondnetwork/nestjs-microservice-common/lib/src/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { LoggingModule } from '@elrondnetwork/nestjs-microservice-common';

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule,
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
