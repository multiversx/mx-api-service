import { Args, Float, Resolver, Query, ResolveField, Parent } from "@nestjs/graphql";

import { AccountService } from "src/endpoints/accounts/account.service";
import { GetTransactionsInput, GetTransactionsCountInput } from "src/graphql/transaction/transaction.input.type";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";

@Resolver(() => Transaction)
export class TransactionResolver {
  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService) {}

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

  @ResolveField("receiver", () => AccountDetailed, { name: "receiver", description: "" })
  public async getReceiver(@Parent() transaction: Transaction) {
    return await this.accountService.getAccount(transaction.receiver);
  }

  @ResolveField("sender", () => AccountDetailed, { name: "sender", description: "" })
  public async getSender(@Parent() transaction: Transaction) {
    return await this.accountService.getAccount(transaction.sender);
  }
}
