import { Module } from "@nestjs/common";

import { AccountModule as InternalAccountModule } from "src/endpoints/accounts/account.module";
import { TransactionModule as InternalTransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionDetailedResolver } from "src/graphql/transaction/resolver/transaction.detailed.resolver";
import { TransactionResolver } from "src/graphql/transaction/resolver/transaction.resolver";

@Module({
  imports: [InternalAccountModule, InternalTransactionModule],
  providers: [TransactionDetailedResolver, TransactionResolver],
})
export class TransactionModule {}
