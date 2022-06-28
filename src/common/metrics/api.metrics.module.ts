import { MetricsModule } from "@elrondnetwork/nestjs-microservice-common";
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
