import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '../common/common.module';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../endpoints/endpoints.services.module';
import { MicroserviceModule } from 'src/common/microservice.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => CommonModule),
    forwardRef(() => EndpointsServicesModule),
    MicroserviceModule,
  ],
  providers: [
    CacheWarmerService,
  ],
})
export class CacheWarmerModule {}
