import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "./api-config/api.config.module";
import { CachingModule } from "./caching/caching.module";
import { DatabaseModule } from "./database/database.module";
import { ElasticModule } from "./elastic/elastic.module";
import { ExternalModule } from "./external/external.module";
import { GatewayModule } from "./gateway/gateway.module";
import { KeybaseModule } from "./keybase/keybase.module";
import { MetricsModule } from "./metrics/metrics.module";
import { ApiModule } from "./network/api.module";
import { ProtocolModule } from "./protocol/protocol.module";

@Module({
  imports: [
    forwardRef(() => ApiConfigModule),
    forwardRef(() => CachingModule),
    forwardRef(() => ApiModule),
    forwardRef(() => ElasticModule),
    forwardRef(() => GatewayModule),
    forwardRef(() => ExternalModule),
    forwardRef(() => KeybaseModule),
    forwardRef(() => MetricsModule),
    forwardRef(() => ProtocolModule),
    forwardRef(() => DatabaseModule),
  ],
  exports: [
    ApiConfigModule, CachingModule, ApiModule, ElasticModule, GatewayModule, ExternalModule,
    KeybaseModule, MetricsModule, ProtocolModule, DatabaseModule
  ]
})
export class CommonModule { }