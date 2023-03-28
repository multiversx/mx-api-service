import { Args, Resolver, Query } from "@nestjs/graphql";

import { ApplyComplexity } from "@multiversx/sdk-nestjs";

import { GetTransactionDetailedInput, GetTransactionsInput } from "src/graphql/entities/transaction.detailed/transaction.detailed.input";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";

@Resolver()
export class TransactionDetailedQuery {
  constructor(private readonly transactionService: TransactionService) { }

  @Query(() => [TransactionDetailed], { name: "transactions", description: "Retrieve all transactions available for the given input." })
  @ApplyComplexity({ target: TransactionDetailed })
  public async getTransactions(@Args("input", { description: "Input to retrieve the given transactions for." }) input: GetTransactionsInput): Promise<Transaction[]> {
    const options = TransactionQueryOptions.applyDefaultOptions(input.size, { withScamInfo: input.withScamInfo, withUsername: input.withUsername });

    return await this.transactionService.getTransactions(
      new TransactionFilter({
        sender: input.sender,
        receivers: input.receiver ? [input.receiver] : [],
        token: input.token,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        functions: input.function,
        before: input.before,
        after: input.after,
        condition: input.condition,
        order: input.order,
      }),
      new QueryPagination({ from: input.from, size: input.size }),
      options,
    );
  }

  @Query(() => TransactionDetailed, { name: "transaction", description: "Retrieve the detailed transaction for the given input.", nullable: true })
  public async getTransactionDetailed(@Args("input", { description: "Input to retrieve the given detailed transaction for." }) input: GetTransactionDetailedInput): Promise<TransactionDetailed | null> {
    return await this.transactionService.getTransaction(GetTransactionDetailedInput.resolve(input));
  }
}
