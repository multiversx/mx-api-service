import { Global, Module } from "@nestjs/common";
import { MetricsModule } from "../metrics/metrics.module";
import { ApiModule } from "../network/api.module";
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
