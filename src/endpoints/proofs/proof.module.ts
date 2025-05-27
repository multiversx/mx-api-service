import { Module } from "@nestjs/common";
import { ProofService } from "./proof.service";
import { TransactionActionModule } from "../transactions/transaction-action/transaction.action.module";

@Module({
  imports: [
    TransactionActionModule,
  ],
  providers: [
    ProofService,
  ],
  exports: [
    ProofService,
  ],
})

export class ProofModule { }
