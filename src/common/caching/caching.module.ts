import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { BlsModule } from "../../endpoints/bls/bls.module";
import { ElasticModule } from "../elastic/elastic.module";
import { CacheConfigService } from "./cache.config.service";
import { CachingService } from "./caching.service";
import { MicroserviceModule } from "../microservice/microservice.module";
import { MetricsModule } from "../metrics/metrics.module";
import { LocalCacheService } from "./local.cache.service";
import { ProtocolModule } from "../protocol/protocol.module";

@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => MicroserviceModule),
    ElasticModule,
    BlsModule,
    forwardRef(() => MetricsModule),
    forwardRef(() => ProtocolModule)
  ],
  providers: [
    CachingService, CacheConfigService, LocalCacheService,
  ],
  exports: [
    CachingService, CacheConfigService,
  ]
})
export class CachingModule { }