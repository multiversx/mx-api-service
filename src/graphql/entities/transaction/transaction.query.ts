import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { GetTransactionsCountInput } from "src/graphql/entities/transaction/transaction.input";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Resolver()
export class TransactionQuery {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => Float, { name: "transactionsCount", description: "Retrieve all transactions count for the given input." })
  public async getTransactionsCount(@Args("input", { description: "Input to retrieve the given transactions count for." }) input: GetTransactionsCountInput): Promise<number> {
    return await this.transactionService.getTransactionCount(GetTransactionsCountInput.resolve(input));
  }
}
