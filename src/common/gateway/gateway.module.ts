import { Global, Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { ApiConfigModule } from "../api-config/api.config.module";
import { GatewayService } from "./gateway.service";
import { GatewayIterateKeysService } from "./gateway.iterate.keys.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [
    GatewayService,
    GatewayIterateKeysService,
  ],
  exports: [
    GatewayService,
    GatewayIterateKeysService,
  ],
})
export class GatewayModule { }
