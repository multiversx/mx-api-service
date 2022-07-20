import { Resolver } from "@nestjs/graphql";

import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQuery } from "src/graphql/entities/transaction/transaction.query";

@Resolver(() => Transaction)
export class TransactionResolver extends TransactionQuery {
  constructor(transactionService: TransactionService) {
    super(transactionService);
  }
}
