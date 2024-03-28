import { Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { GatewayProxyController } from "./gateway.proxy.controller";
import { IndexProxyController } from "./index.proxy.controller";

@Module({
  imports: [
    VmQueryModule,
    PluginModule,
  ],
  controllers: [
    GatewayProxyController,
    IndexProxyController,
  ],
})
export class ProxyModule { }
