import { forwardRef, Module } from "@nestjs/common";
import { AssetsModule } from "src/common/assets/assets.module";
import { TransactionActionModule } from "../transactions/transaction-action/transaction.action.module";
import { SmartContractResultService } from "./scresult.service";

@Module({
  imports: [
    forwardRef(() => TransactionActionModule),
    AssetsModule,
  ],
  providers: [
    SmartContractResultService,
  ],
  exports: [
    SmartContractResultService,
  ],
})
export class SmartContractResultModule { }
