import { Args, Resolver, Query } from "@nestjs/graphql";

import { GetTransactionDetailedInput } from "src/graphql/entities/transaction.detailed/transaction.detailed.input";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Resolver()
export class TransactionDetailedQuery {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => TransactionDetailed, { name: "transaction", description: "Retrieve the detailed transaction for the given input.", nullable: true })
  public async getTransaction(@Args("input", { description: "Input to retrieve the given detailed transaction for." }) input: GetTransactionDetailedInput): Promise<TransactionDetailed | null> {
    return await this.transactionService.getTransaction(GetTransactionDetailedInput.resolve(input));
  }
}
