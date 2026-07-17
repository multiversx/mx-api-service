import { Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { GatewayProxyController } from "./gateway.proxy.controller";

@Module({
  imports: [
    VmQueryModule,
    PluginModule,
  ],
  controllers: [
    GatewayProxyController,
  ],
})
export class ProxyModule { }
