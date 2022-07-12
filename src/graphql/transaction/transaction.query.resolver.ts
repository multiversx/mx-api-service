import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { GetTransactionInput, GetTransactionsInput, GetTransactionsCountInput } from "src/graphql/transaction/transaction.query.input.type";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";

@Resolver(() => Transaction)
export class TransactionQueryResolver {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => [Transaction], { name: "transactions", description: "Retrieve all transactions available." })
  public async getTransactions(@Args("input", { description: "Get transactions input." }) input: GetTransactionsInput): Promise<Transaction[]> {
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

  @Query(() => Float, { name: "transactionsCount", description: "Retrieve all available transactions total count." })
  public async getTransactionsCount(@Args("input", { description: "Get transactions count input." }) input: GetTransactionsCountInput): Promise<number> {
    return await this.transactionService.getTransactionCount(GetTransactionsCountInput.resolve(input));
  }

  @Query(() => TransactionDetailed, { name: "transaction", description: "Retrieve the transaction for the given address." })
  public async getTransaction(@Args("input", { description: "Get transaction input." }) input: GetTransactionInput): Promise<TransactionDetailed | null> {
    return await this.transactionService.getTransaction(input.hash, input.fields);
  }
}
