import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/endpoints/metrics/metrics.module";
import { ApiConfigModule } from "../api.config.module";
import { ApiModule } from "./api.module";
import { ElasticService } from "./elastic.service";


@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => ApiModule),
    MetricsModule
  ],
  providers: [
    ElasticService
  ],
  exports: [
    ElasticService
  ]
})
export class ElasticModule { }