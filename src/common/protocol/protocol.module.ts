import { forwardRef, Module } from "@nestjs/common";
import { CachingModule } from "../caching/caching.module";
import { GatewayModule } from "../gateway/gateway.module";
import { ProtocolService } from "./protocol.service";

@Module({
  imports: [
    forwardRef(() => CachingModule),
    forwardRef(() => GatewayModule),
  ],
  providers: [
    ProtocolService,
  ],
  exports: [
    ProtocolService,
  ]
})
export class ProtocolModule { }