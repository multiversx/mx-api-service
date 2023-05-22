import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { GatewayModule } from "src/common/gateway/gateway.module";
import { ProtocolModule } from "src/common/protocol/protocol.module";
import { SettingsModule } from "src/common/settings/settings.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { VmQueryService } from "./vm.query.service";

@Module({
  imports: [
    DynamicModuleUtils.getCacheModule(),
    GatewayModule,
    ProtocolModule,
    ApiConfigModule,
    SettingsModule,
    EventEmitterModule.forRoot({ maxListeners: 1 }),
  ],
  providers: [
    VmQueryService,
  ],
  exports: [
    VmQueryService,
  ],
})
export class VmQueryModule { }
