import { Resolver } from "@nestjs/graphql";

import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionDetailedQuery } from "./transaction.detailed.query";

@Resolver(() => TransactionDetailed)
export class TransactionDetailedResolver extends TransactionDetailedQuery {
  constructor(transactionService: TransactionService) {
    super(transactionService);
  }
}
