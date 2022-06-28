import { Global, Module } from "@nestjs/common";
import { ApiMetricsService } from "./api.metrics.service";

@Global()
@Module({
  providers: [
    ApiMetricsService,
  ],
  exports: [
    ApiMetricsService,
  ],
})
export class ApiMetricsModule { }
