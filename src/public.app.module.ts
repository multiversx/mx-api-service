import { Module } from '@nestjs/common';
import "./utils/extensions/array.extensions";
import "./utils/extensions/date.extensions";
import "./utils/extensions/number.extensions";
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';

@Module({
  imports: [
    EndpointsServicesModule,
    EndpointsControllersModule,
  ],
  exports: [
    EndpointsServicesModule,
  ],
})
export class PublicAppModule { }
