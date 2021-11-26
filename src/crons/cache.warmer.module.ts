import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '../common/common.module';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../endpoints/endpoints.services.module';
import { MicroserviceModule } from 'src/common/microservice/microservice.module';
import { PluginModule } from 'src/plugins/plugin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => CommonModule),
    forwardRef(() => EndpointsServicesModule),
    MicroserviceModule,
    PluginModule,
  ],
  providers: [
    CacheWarmerService,
  ],
})
export class CacheWarmerModule {}
