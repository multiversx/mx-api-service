import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/endpoints/metrics/metrics.module";
import { ApiConfigModule } from "../api.config.module";
import { ApiService } from "./api.service";


@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => MetricsModule)
  ],
  providers: [
    ApiService
  ],
  exports: [
    ApiService
  ]
})
export class ApiModule { }