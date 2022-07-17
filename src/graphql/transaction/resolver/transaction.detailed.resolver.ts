import { Args, Resolver, Query, ResolveField, Parent } from "@nestjs/graphql";

import { AccountService } from "src/endpoints/accounts/account.service";
import { GetTransactionInput } from "src/graphql/transaction/transaction.input.type";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";

@Resolver(() => TransactionDetailed)
export class TransactionDetailedResolver {
  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService
  ) {}

  @Query(() => TransactionDetailed, { name: "transaction", description: "Retrieve the transaction for the given address.", nullable: true })
  public async getTransaction(@Args("input", { description: "Input to retrieve the given transaction for." }) input: GetTransactionInput): Promise<TransactionDetailed | null> {
    return await this.transactionService.getTransaction(GetTransactionInput.resolve(input));
  }

  @ResolveField("receiver", () => AccountDetailed, { name: "receiver", description: "Receiver account for the given transaction." })
  public async getReceiver(@Parent() transaction: TransactionDetailed) {
    return await this.accountService.getAccount(transaction.receiver);
  }

  @ResolveField("sender", () => AccountDetailed, { name: "sender", description: "Sender account for the given transaction." })
  public async getSender(@Parent() transaction: TransactionDetailed) {
    return await this.accountService.getAccount(transaction.sender);
  }
}
