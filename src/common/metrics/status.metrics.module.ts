import { MetricsModule } from "@elrondnetwork/erdnest";
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
