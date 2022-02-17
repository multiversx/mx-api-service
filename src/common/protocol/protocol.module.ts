import { Global, Module } from "@nestjs/common";
import { ProtocolService } from "./protocol.service";

@Global()
@Module({
  providers: [
    ProtocolService,
  ],
  exports: [
    ProtocolService,
  ],
})
export class ProtocolModule { }
