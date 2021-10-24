import { forwardRef, Module } from "@nestjs/common";
import { ProxyModule } from "src/endpoints/proxy/proxy.module";
import { ApiConfigModule } from "../api-config/api.config.module";
import { GatewayModule } from "../gateway/gateway.module";
import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => GatewayModule),
    forwardRef(() => ProxyModule)
  ],
  providers: [
    MetricsService,
  ],
  exports: [
    MetricsService,
  ]
})
export class MetricsModule { }