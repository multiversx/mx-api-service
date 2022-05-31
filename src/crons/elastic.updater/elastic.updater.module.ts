import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EndpointsServicesModule } from 'src/endpoints/endpoints.services.module';
import { ElasticUpdaterService } from './elastic.updater.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
  ],
  providers: [
    ElasticUpdaterService,
  ],
})
export class ElasticUpdaterModule { }
