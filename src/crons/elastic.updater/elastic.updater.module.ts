import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetsModule } from 'src/common/assets/assets.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { EndpointsServicesModule } from 'src/endpoints/endpoints.services.module';
import { ElasticUpdaterService } from './elastic.updater.service';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ maxListeners: 1 }),
    PersistenceModule.forRoot(),
    EndpointsServicesModule,
    AssetsModule,
    ApiMetricsModule,
  ],
  providers: [
    ElasticUpdaterService,
  ],
})
export class ElasticUpdaterModule { }
