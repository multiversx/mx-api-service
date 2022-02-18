import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { MetricsModule } from "../metrics/metrics.module";
import { ApiModule } from "../network/api.module";
import { ElasticService } from "./elastic.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
    MetricsModule,
  ],
  providers: [
    ElasticService,
  ],
  exports: [
    ElasticService,
  ],
})
export class ElasticModule { }
