import { Module } from "@nestjs/common";

import { TransactionModule as InternalTransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionResolver } from "src/graphql/entities/transaction/transaction.resolver";

@Module({
  imports: [InternalTransactionModule],
  providers: [TransactionResolver],
})
export class TransactionModule {}
