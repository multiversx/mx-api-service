import { forwardRef, Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { BlsModule } from "src/endpoints/bls/bls.module";
import { ElasticIndexerHelper } from "./elastic.indexer.helper";
import { ElasticIndexerService } from "./elastic.indexer.service";
import { EsCircuitBreakerProxyModule } from "./circuit-breaker/circuit.breaker.proxy.module";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => BlsModule),
    EsCircuitBreakerProxyModule,
  ],
  providers: [ElasticIndexerService, ElasticIndexerHelper],
  exports: [ElasticIndexerService, ElasticIndexerHelper],
})
export class ElasticIndexerModule { }
