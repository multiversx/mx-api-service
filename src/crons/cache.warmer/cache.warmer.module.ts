import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../../endpoints/endpoints.services.module';
import { PluginModule } from 'src/plugins/plugin.module';
import { MicroserviceModule } from 'src/common/microservice/microservice.module';
import { KeybaseModule } from 'src/common/keybase/keybase.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    PluginModule,
    MicroserviceModule,
    KeybaseModule,
  ],
  providers: [
    CacheWarmerService,
  ],
})
export class CacheWarmerModule { }
