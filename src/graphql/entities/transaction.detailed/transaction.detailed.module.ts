import { Module } from "@nestjs/common";

import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { TransactionDetailedResolver } from "src/graphql/entities/transaction.detailed/transaction.detailed.resolver";

@Module({
  imports: [TransactionModule],
  providers: [TransactionDetailedResolver],
})
export class TransactionDetailedModule {}
