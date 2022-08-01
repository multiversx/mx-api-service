import { forwardRef, Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiMetricsModule } from "src/common/metrics/api.metrics.module";
import { BlsModule } from "src/endpoints/bls/bls.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { ElasticIndexerService } from "./elastic.indexer.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    ApiMetricsModule,
    forwardRef(() => BlsModule),
    DynamicModuleUtils.getElasticModule(),
  ],
  providers: [
    ElasticIndexerService,
  ],
  exports: [
    ElasticIndexerService,
  ],
})
export class ElasticIndexerModule { }
