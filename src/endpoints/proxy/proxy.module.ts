import { forwardRef, Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { VmQueryModule } from "../vm.query/vm.query.module";
import { ProxyController } from "./proxy.controller";

@Module({
  imports: [
    forwardRef(() => VmQueryModule),
    forwardRef(() => PluginModule),
  ],
  controllers: [
    ProxyController,
  ],
})
export class ProxyModule { }
