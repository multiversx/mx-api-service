import { Global, Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { ApiConfigModule } from "../api-config/api.config.module";
import { GatewayService } from "./gateway.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [
    GatewayService,
  ],
  exports: [
    GatewayService,
  ],
})
export class GatewayModule { }
