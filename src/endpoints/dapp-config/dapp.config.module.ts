import { Module } from "@nestjs/common";
import { DappConfigService } from "./dapp.config.service";

@Module({
  providers: [
    DappConfigService,
  ],
  exports: [
    DappConfigService,
  ],
})
export class DappConfigModule { }
