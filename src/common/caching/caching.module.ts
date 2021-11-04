import { CacheModule, forwardRef, Module } from "@nestjs/common";
import { RoundService } from "src/endpoints/rounds/round.service";
import { ApiConfigModule } from "../api-config/api.config.module";
import { BlsModule } from "../../endpoints/bls/bls.module";
import { ElasticModule } from "../elastic/elastic.module";
import { GENESIS_TIMESTAMP_SERVICE } from "../../utils/genesis.timestamp.interface";
import { CacheConfigService } from "./cache.config.service";
import { CachingService } from "./caching.service";
import { MicroserviceModule } from "../microservice.module";
import { MetricsModule } from "../metrics/metrics.module";

@Module({
  imports: [
    CacheModule.register(),
    ApiConfigModule,
    forwardRef(() => MicroserviceModule),
    ElasticModule,
    BlsModule,
    MetricsModule,
  ],
  providers: [
    CachingService, CacheConfigService,
    {
      useClass: RoundService,
      provide: GENESIS_TIMESTAMP_SERVICE
    }
  ],
  exports: [
    CachingService, CacheConfigService,
  ]
})
export class CachingModule { }