import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { PluginModule } from "src/plugins/plugin.module";
import { TokenModule } from "../tokens/token.module";
import { TransferService } from "./transfer.service";


@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => PluginModule),
    forwardRef(() => TokenModule),
  ],
  providers: [
    TransferService,
  ],
  exports: [
    TransferService,
  ],
})
export class TransferModule { }
