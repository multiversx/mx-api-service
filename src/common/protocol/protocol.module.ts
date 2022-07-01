import { forwardRef, Global, Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { GatewayModule } from "../gateway/gateway.module";
import { ProtocolService } from "./protocol.service";

@Global()
@Module({
  imports: [
    forwardRef(() => GatewayModule),
    DynamicModuleUtils.getCachingModule(),
    DynamicModuleUtils.getElasticModule(),
  ],
  providers: [
    ProtocolService,
  ],
  exports: [
    ProtocolService,
  ],
})
export class ProtocolModule { }
