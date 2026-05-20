import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetsModule } from 'src/common/assets/assets.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { EndpointsServicesModule } from 'src/endpoints/endpoints.services.module';
import { ElasticUpdaterService } from './elastic.updater.service';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    AssetsModule,
    forwardRef(() => PersistenceModule),
    ApiMetricsModule,
  ],
  providers: [
    ElasticUpdaterService,
  ],
})
export class ElasticUpdaterModule { }
