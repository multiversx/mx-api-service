import { Module } from "@nestjs/common";

import { AccountModule as InternalAccountModule } from "src/endpoints/accounts/account.module";
import { TransactionModule as InternalTransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionResolver } from "src/graphql/transaction/transaction.resolver";
import { TransactionDetailedResolver } from "src/graphql/transaction/transaction.detailed.resolver";

@Module({
  imports: [InternalAccountModule, InternalTransactionModule],
  providers: [TransactionResolver, TransactionDetailedResolver],
})
export class TransactionModule {}
