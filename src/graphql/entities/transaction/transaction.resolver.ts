import { Resolver } from "@nestjs/graphql";

import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQuery } from "src/graphql/entities/transaction/transaction.query";

@Resolver(() => TransactionDetailed)
export class TransactionResolver extends TransactionQuery {
  constructor(transactionService: TransactionService) {
    super(transactionService);
  }
}
