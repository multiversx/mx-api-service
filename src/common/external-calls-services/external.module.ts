import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api.config.module";
import { CachingModule } from "../caching/caching.module";
import { ApiService } from "./api.service";
import { DataApiService } from "./data.api.service";
import { ElasticService } from "./elastic.service";
import { ExtrasApiService } from "./extras-api.service";
import { GatewayService } from "./gateway.service";
import { KeybaseService } from "./keybase.service";
import { MetricsModule } from "../../endpoints/metrics/metrics.module"
import { NodeModule } from "src/endpoints/nodes/node.module";
import { ProviderModule } from "src/endpoints/providers/provider.module";

@Module({
  imports: [
    ApiConfigModule, CachingModule, 
    forwardRef(() => NodeModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => MetricsModule)
  ],
  providers: [
    ApiService, DataApiService, ElasticService,
    ExtrasApiService, GatewayService, KeybaseService,
  ],
  exports: [
    ApiService, DataApiService, ElasticService,
    ExtrasApiService, GatewayService, KeybaseService,
  ]
})
export class ExternalModule { }