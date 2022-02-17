import { forwardRef, Module } from "@nestjs/common";
import { DataApiModule } from "src/common/external/data.api.module";
import { PluginModule } from "src/plugins/plugin.module";
import { TokenModule } from "../tokens/token.module";
import { TransactionGetService } from "./transaction.get.service";
import { TransactionPriceService } from "./transaction.price.service";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    PluginModule,
    forwardRef(() => TokenModule),
    DataApiModule,
  ],
  providers: [
    TransactionGetService, TransactionPriceService, TransactionService,
  ],
  exports: [
    TransactionGetService, TransactionPriceService, TransactionService,
  ],
})
export class TransactionModule { }
