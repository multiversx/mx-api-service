import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { CachingModule } from "../caching/caching.module";
import { GatewayModule } from "../gateway/gateway.module";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => GatewayModule),
    forwardRef(() => CachingModule),
  ],
  providers: [
    MetricsService,
  ],
  exports: [
    MetricsService,
  ]
})
export class MetricsModule { }