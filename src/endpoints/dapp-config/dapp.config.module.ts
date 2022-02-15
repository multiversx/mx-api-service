import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { DappConfigService } from "./dapp.config.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
  ],
  providers: [
    DappConfigService,
  ],
  exports: [
    DappConfigService,
  ],
})
export class DappConfigModule { }
