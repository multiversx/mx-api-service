import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "src/common/common.module";
import { PluginsModule } from "src/plugins/plugins.module";
import { PotentialScamTransactionChecker } from "./scam-check/potential.scam.transaction.checker";
import { TransactionScamCheckService } from "./scam-check/transaction.scam.check.service";
import { TokenTransferService } from "./token.transfer.service";
import { TransactionGetService } from "./transaction.get.service";
import { TransactionPriceService } from "./transaction.price.service";
import { TransactionService } from "./transaction.service";

@Module({
  imports: [
    forwardRef(() => CommonModule),
    PluginsModule,
  ],
  providers: [
    TokenTransferService, TransactionGetService, TransactionPriceService, TransactionService, TransactionScamCheckService, PotentialScamTransactionChecker
  ],
  exports: [
    TokenTransferService, TransactionGetService, TransactionPriceService, TransactionService, TransactionScamCheckService, PotentialScamTransactionChecker
  ]
})
export class TransactionModule { }