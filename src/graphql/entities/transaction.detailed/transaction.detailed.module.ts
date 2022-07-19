import { Module } from "@nestjs/common";

import { TransactionDetailedResolver } from "src/graphql/entities/transaction.detailed/transaction.detailed.resolver";
import { TransactionDetailedLoader } from "src/graphql/entities/transaction.detailed/transaction.detailed.loader";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";

@Module({
  imports: [TransactionModule],
  providers: [TransactionDetailedLoader, TransactionDetailedResolver],
})
export class TransactionDetailedModule {}
