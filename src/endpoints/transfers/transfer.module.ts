import { Module } from "@nestjs/common";
import { PluginModule } from "src/plugins/plugin.module";
import { TokenModule } from "../tokens/token.module";
import { TransferService } from "./transfer.service";


@Module({
  imports: [
    PluginModule,
    TokenModule,
  ],
  providers: [
    TransferService,
  ],
  exports: [
    TransferService,
  ],
})
export class TransferModule { }
