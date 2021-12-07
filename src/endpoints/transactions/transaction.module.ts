import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { PluginModule } from "src/plugins/plugin.module";
import { TokenTransferService } from "./token.transfer.service";
import { TransactionGetService } from "./transaction.get.service";
import { TransactionPriceService } from "./transaction.price.service";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    forwardRef(() => PluginModule),
  ],
  providers: [
    TokenTransferService, TransactionGetService, TransactionPriceService, TransactionService,
  ],
  exports: [
    TokenTransferService, TransactionGetService, TransactionPriceService, TransactionService,
  ]
})
export class TransactionModule { }