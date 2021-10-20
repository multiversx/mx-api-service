import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '../common/common.module';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../endpoints/enpoints.services.module';
import { PubSubModule } from '../pub.sub.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => CommonModule),
    forwardRef(() => EndpointsServicesModule),
    PubSubModule,
  ],
  providers: [
    CacheWarmerService,
  ],
})
export class CacheWarmerModule {}
