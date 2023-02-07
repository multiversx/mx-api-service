import { Module } from '@nestjs/common';
import { EventsMetricsService } from './events-metrics.service';

@Module({
  providers: [EventsMetricsService],
  exports: [EventsMetricsService],
})
export class EventsMetricsModule {
}
