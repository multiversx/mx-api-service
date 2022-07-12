import { Module } from "@nestjs/common";

import { TransactionModule as InternalTransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionQueryResolver } from "src/graphql/transaction/transaction.query.resolver";

@Module({
  imports: [InternalTransactionModule],
  providers: [TransactionQueryResolver],
})
export class TransactionModule {}
