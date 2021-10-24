import { forwardRef, Module } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { RoundService } from "src/endpoints/rounds/round.service";
import { VmQueryModule } from "src/endpoints/vm.query/vm.query.module";
import { ApiConfigModule } from "../../common/api-config/api.config.module";
import { BlsModule } from "../bls/bls.module";
import { CachingModule } from "../../common/caching/caching.module";
import { ElasticModule } from "../../common/elastic/elastic.module";
import { EsdtService } from "./esdt.service";
import { ExternalModule } from "../../common/external/external.module";
import { GatewayModule } from "../../common/gateway/gateway.module";
import { GENESIS_TIMESTAMP_SERVICE } from "../../utils/genesis.timestamp.interface";
import { ProxyModule } from "../proxy/proxy.module";


@Module({
  imports: [
    ApiConfigModule, ExternalModule, CachingModule, BlsModule, ElasticModule, GatewayModule, ProxyModule,
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