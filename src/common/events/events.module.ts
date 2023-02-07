import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsMetricsModule } from '../events-metrics/events-metrics.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsMetricsModule, AuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule { }
