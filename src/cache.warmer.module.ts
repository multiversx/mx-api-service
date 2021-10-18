import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiConfigModule } from './common/api.config.module';
import { PubSubModule } from './pub.sub.module';
import { EndpointsModule } from './endpoints/enpoints.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApiConfigModule,
    PubSubModule,
    EndpointsModule
  ],
})
export class CacheWarmerModule {}
