import { MetricsModule } from "@multiversx/sdk-nestjs";
import { Global, Module } from "@nestjs/common";
import { ApiMetricsService } from "./api.metrics.service";

@Global()
@Module({
  imports: [
    MetricsModule,
  ],
  providers: [
    ApiMetricsService,
  ],
  exports: [
    ApiMetricsService,
  ],
})
export class ApiMetricsModule { }
