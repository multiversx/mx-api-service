import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { DataApiModule } from "src/common/data-api/data-api.module";
import { PluginModule } from "src/plugins/plugin.module";
import { TokenModule } from "../tokens/token.module";
import { UsernameModule } from "../usernames/username.module";
import { TransactionActionModule } from "./transaction-action/transaction.action.module";
import { TransactionGetService } from "./transaction.get.service";
import { TransactionPriceService } from "./transaction.price.service";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    forwardRef(() => TokenModule),
    forwardRef(() => PluginModule),
    forwardRef(() => TransactionActionModule),
    AssetsModule,
    UsernameModule,
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
