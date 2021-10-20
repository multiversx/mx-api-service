import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "./api-config/api.config.module";
import { BlsModule } from "./bls.module";
import { CachingModule } from "./caching/caching.module";
import { ElasticModule } from "./elastic/elastic.module";
import { EsdtModule } from "./esdt.module";
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
    forwardRef(() => ExternalModule), 
    forwardRef(() => BlsModule), 
    forwardRef(() => EsdtModule), 
    forwardRef(() => KeybaseModule),
    forwardRef(() => MetricsModule),
  ],
  exports: [
    ApiConfigModule, CachingModule, ExternalModule, BlsModule, EsdtModule,
    KeybaseModule, MetricsModule
  ]
})
export class CommonModule { }