import { Module } from "@nestjs/common";

import { AccountModule } from "src/endpoints/accounts/account.module";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionDetailedResolver } from "src/graphql/entities/transaction.detailed/transaction.detailed.resolver";

@Module({
  imports: [AccountModule, TransactionModule],
  providers: [TransactionDetailedResolver],
})
export class TransactionDetailedModule {}
