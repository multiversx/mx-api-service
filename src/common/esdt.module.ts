import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { RoundService } from "src/endpoints/rounds/round.service";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { ApiConfigModule } from "./api-config/api.config.module";
import { BlsModule } from "./bls.module";
import { CachingModule } from "./caching/caching.module";
import { ElasticModule } from "./elastic/elastic.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "./external/external.module";
import { GatewayModule } from "./gateway/gateway.module";
import { GENESIS_TIMESTAMP_SERVICE } from "./genesis.timestamp";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, CachingModule, BlsModule, ElasticModule, GatewayModule,
    forwardRef(() => VmQueryModule),
    forwardRef(() => MetricsModule),
  ],
  providers: [
    {
      useClass: RoundService,
      provide: GENESIS_TIMESTAMP_SERVICE
    },
    EsdtService
  ],
  exports: [
    EsdtService
  ]
})
export class EsdtModule { }