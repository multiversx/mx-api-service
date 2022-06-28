import { ApiModule } from "@elrondnetwork/nestjs-microservice-common";
import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiMetricsModule } from "../metrics/api.metrics.module";
import { GatewayService } from "./gateway.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    ApiMetricsModule,
    ApiModule,
  ],
  providers: [
    GatewayService,
  ],
  exports: [
    GatewayService,
  ],
})
export class GatewayModule { }
