import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { Global, Module } from "@nestjs/common";
import { ApiMetricsService } from "./api.metrics.service";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { GatewayModule } from "src/common/gateway/gateway.module";
import { ProtocolModule } from "src/common/protocol/protocol.module";

@Global()
@Module({
  imports: [
    MetricsModule,
    ApiConfigModule,
    GatewayModule,
    ProtocolModule,
  ],
  providers: [
    ApiMetricsService,
  ],
  exports: [
    ApiMetricsService,
  ],
})
export class ApiMetricsModule { }
