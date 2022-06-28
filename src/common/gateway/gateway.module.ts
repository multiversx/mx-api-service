import { ApiModule } from "@elrondnetwork/nestjs-microservice-common";
import { Global, Module } from "@nestjs/common";
import { ApiMetricsModule } from "../metrics/api.metrics.module";
import { GatewayService } from "./gateway.service";

@Global()
@Module({
  imports: [
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
