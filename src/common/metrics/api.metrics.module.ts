import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ApiMetricsService } from "./api.metrics.service";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { GatewayModule } from "src/common/gateway/gateway.module";
import { ProtocolModule } from "src/common/protocol/protocol.module";

@Global()
@Module({
  imports: [
    MetricsModule,
    EventEmitterModule.forRoot({ maxListeners: 1 }),
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
