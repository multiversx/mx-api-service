import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ApiMetricsService } from "./api.metrics.service";

@Global()
@Module({
  imports: [
    MetricsModule,
    EventEmitterModule.forRoot({ maxListeners: 1 }),
  ],
  providers: [
    ApiMetricsService,
  ],
  exports: [
    ApiMetricsService,
  ],
})
export class ApiMetricsModule { }
