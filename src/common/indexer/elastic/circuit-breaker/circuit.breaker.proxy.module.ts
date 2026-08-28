import { Global, Module } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { EsCircuitBreakerProxy } from "./circuit.breaker.proxy.service";

@Global()
@Module({
  imports: [
    ApiConfigModule,
    DynamicModuleUtils.getElasticModule(),
    DynamicModuleUtils.getApiModule(),
  ],
  providers: [EsCircuitBreakerProxy],
  exports: [EsCircuitBreakerProxy],
})
export class EsCircuitBreakerProxyModule { }
