import { Module } from "@nestjs/common";
import { ApiConfigModule } from "../api.config.module";
import { ApiModule } from "./api.module";
import { GatewayService } from "./gateway.service";


@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
  ],
  providers: [
    GatewayService
  ],
  exports: [
    GatewayService
  ]
})
export class GatewayModule { }