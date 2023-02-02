import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetsModule } from 'src/common/assets/assets.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { EndpointsServicesModule } from 'src/endpoints/endpoints.services.module';
import { ElasticUpdaterService } from './elastic.updater.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    AssetsModule,
    forwardRef(() => PersistenceModule),
  ],
  providers: [
    ElasticUpdaterService,
  ],
})
export class ElasticUpdaterModule { }
