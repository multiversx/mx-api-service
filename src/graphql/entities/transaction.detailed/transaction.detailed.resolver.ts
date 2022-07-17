import { Resolver, ResolveField, Parent } from "@nestjs/graphql";

import { AccountService } from "src/endpoints/accounts/account.service";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { TransactionDetailedQuery } from "./transaction.detailed.query";

@Resolver(() => TransactionDetailed)
export class TransactionDetailedResolver extends TransactionDetailedQuery {
  constructor(
    private readonly accountService: AccountService,
    transactionService: TransactionService
  ) {
    super(transactionService);
  }

  @ResolveField("receiver", () => AccountDetailed, { name: "receiver", description: "Receiver detailed account for the given detailed transaction." })
  public async getReceiver(@Parent() transaction: TransactionDetailed) {
    return await this.accountService.getAccount(transaction.receiver);
  }

  @ResolveField("sender", () => AccountDetailed, { name: "sender", description: "Sender detailed account for the given detailed transaction." })
  public async getSender(@Parent() transaction: TransactionDetailed) {
    return await this.accountService.getAccount(transaction.sender);
  }
}
