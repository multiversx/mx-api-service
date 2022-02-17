import { Global, Module } from "@nestjs/common";
import { GatewayService } from "./gateway.service";

@Global()
@Module({
  providers: [
    GatewayService,
  ],
  exports: [
    GatewayService,
  ],
})
export class GatewayModule { }
