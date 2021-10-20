import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { ApiConfigModule } from "../api.config.module";
import { ApiModule } from "../external/api.module";
import { ElasticService } from "./elastic.service";


@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
    forwardRef(() => MetricsModule)
  ],
  providers: [
    ElasticService
  ],
  exports: [
    ElasticService
  ]
})
export class ElasticModule { }