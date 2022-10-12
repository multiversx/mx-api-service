import { Module } from "@nestjs/common";
import { DappConfigModule as InternalDappConfigModule } from "src/endpoints/dapp-config/dapp.config.module";
import { DappConfigResolver } from "./dap.config.resolver";

@Module({
  imports: [InternalDappConfigModule],
  providers: [DappConfigResolver],
})
export class DappConfigModule { }
