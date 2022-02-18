import { forwardRef, Module } from "@nestjs/common";
import { ApiConfigModule } from "../api-config/api.config.module";
import { MetricsModule } from "../metrics/metrics.module";
import { ApiModule } from "../network/api.module";
import { GatewayService } from "./gateway.service";


@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => ApiModule),
    forwardRef(() => MetricsModule),
  ],
  providers: [
    GatewayService,
  ],
  exports: [
    GatewayService,
  ],
})
export class GatewayModule { }
