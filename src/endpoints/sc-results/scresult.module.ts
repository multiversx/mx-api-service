import { forwardRef, Module } from "@nestjs/common";
import { TransactionActionModule } from "../transactions/transaction-action/transaction.action.module";
import { SmartContractResultService } from "./scresult.service";

@Module({
  imports: [
    forwardRef(() => TransactionActionModule),
  ],
  providers: [
    SmartContractResultService,
  ],
  exports: [
    SmartContractResultService,
  ],
})
export class SmartContractResultModule { }
