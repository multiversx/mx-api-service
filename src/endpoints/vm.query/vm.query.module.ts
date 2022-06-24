import { CachingModule } from "@elrondnetwork/nestjs-microservice-template";
import { Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { GatewayModule } from "src/common/gateway/gateway.module";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { ProtocolModule } from "src/common/protocol/protocol.module";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    CachingModule,
    GatewayModule,
    ProtocolModule,
    ApiConfigModule,
    MetricsModule,
  ],
  providers: [
    VmQueryService,
  ],
  exports: [
    VmQueryService,
  ],
})
export class VmQueryModule { }
