import { ApiModule } from "@elrondnetwork/nestjs-microservice-common";
import { Global, Module } from "@nestjs/common";
import { MetricsModule } from "../metrics/metrics.module";
import { GatewayService } from "./gateway.service";

@Global()
@Module({
  imports: [
    MetricsModule,
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
