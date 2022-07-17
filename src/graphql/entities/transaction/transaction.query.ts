import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { GetTransactionsInput, GetTransactionsCountInput } from "src/graphql/entities/transaction/transaction.input";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";

@Resolver()
export class TransactionQuery {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => [Transaction], { name: "transactions", description: "Retrieve all transactions available for the given input." })
  public async getTransactions(@Args("input", { description: "Input to retrieve the given transactions for." }) input: GetTransactionsInput): Promise<Transaction[]> {
      return await this.transactionService.getTransactions(
        new TransactionFilter({
          sender: input.sender,
          receiver: input.receiver,
          token: input.token,
          senderShard: input.senderShard,
          receiverShard: input.receiverShard,
          miniBlockHash: input.miniBlockHash,
          hashes: input.hashes,
          status: input.status,
          search: input.search,
          function: input.function,
          before: input.before,
          after: input.after,
          condition: input.condition,
          order: input.order,
        }), 
        new QueryPagination({ from: input.from, size: input.size }), 
        new TransactionQueryOptions({ 
          withScResults: input.withSmartContractResults, 
          withOperations: input.withOperations, 
          withLogs: input.withLogs, 
        })
      );
  }

  @Query(() => Float, { name: "transactionsCount", description: "Retrieve all transactions count for the given input." })
  public async getTransactionsCount(@Args("input", { description: "Input to retrieve the given transactions count for." }) input: GetTransactionsCountInput): Promise<number> {
    return await this.transactionService.getTransactionCount(GetTransactionsCountInput.resolve(input));
  }
}
