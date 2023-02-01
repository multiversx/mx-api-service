import { MetricsModule } from "@multiversx/sdk-nestjs";
import { Global, Module } from "@nestjs/common";
import { StatusMetricsService } from "./status.metrics.service";

@Global()
@Module({
  imports: [
    MetricsModule,
  ],
  providers: [
    StatusMetricsService,
  ],
  exports: [
    StatusMetricsService,
  ],
})
export class StatusMetricsModule { }
