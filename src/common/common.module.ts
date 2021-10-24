import { forwardRef, Module } from "@nestjs/common";
import { ProxyModule } from "src/endpoints/proxy/proxy.module";
import { ApiConfigModule } from "./api-config/api.config.module";
import { CachingModule } from "./caching/caching.module";
import { ElasticModule } from "./elastic/elastic.module";
import { ExternalModule } from "./external/external.module";
import { GatewayModule } from "./gateway/gateway.module";
import { KeybaseModule } from "./keybase/keybase.module";
import { MetricsModule } from "./metrics/metrics.module";
import { ApiModule } from "./network/api.module";

@Module({
  imports: [
    forwardRef(() => ApiConfigModule), 
    forwardRef(() => CachingModule),
    forwardRef(() => ApiModule),
    forwardRef(() => ElasticModule),
    forwardRef(() => GatewayModule),  
    forwardRef(() => ProxyModule),  
    forwardRef(() => ExternalModule),  
    forwardRef(() => KeybaseModule),
    forwardRef(() => MetricsModule),
  ],
  exports: [
    ApiConfigModule, CachingModule, ApiModule, ElasticModule, GatewayModule, ProxyModule,
    ExternalModule, KeybaseModule, MetricsModule,
  ]
})
export class CommonModule { }