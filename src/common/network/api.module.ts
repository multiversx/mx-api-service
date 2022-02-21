import { Global, Module } from "@nestjs/common";
import { MetricsModule } from "../metrics/metrics.module";
import { ApiService } from "./api.service";

@Global()
@Module({
  imports: [
    MetricsModule,
  ],
  providers: [
    ApiService,
  ],
  exports: [
    ApiService,
  ],
})
export class ApiModule { }
