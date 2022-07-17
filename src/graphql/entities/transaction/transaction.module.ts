import { Module } from "@nestjs/common";

import { AccountModule } from "src/endpoints/accounts/account.module";
import { TransactionModule as InternalTransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionResolver } from "src/graphql/entities/transaction/transaction.resolver";

@Module({
  imports: [AccountModule, InternalTransactionModule],
  providers: [TransactionResolver],
})
export class TransactionModule {}
