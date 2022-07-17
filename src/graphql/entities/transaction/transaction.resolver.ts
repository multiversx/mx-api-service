import { Resolver, ResolveField, Parent } from "@nestjs/graphql";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionQuery } from "src/graphql/entities/transaction/transaction.query";

@Resolver(() => Transaction)
export class TransactionResolver extends TransactionQuery {
  constructor(
    private readonly accountService: AccountService,
    transactionService: TransactionService
  ) {
    super(transactionService);
  }

  @ResolveField("receiver", () => AccountDetailed, { name: "receiver", description: "Receiver detailed account for the given transaction." })
  public async getReceiver(@Parent() transaction: Transaction) {
    return await this.accountService.getAccount(transaction.receiver);
  }

  @ResolveField("sender", () => AccountDetailed, { name: "sender", description: "Sender detailed account for the given transaction." })
  public async getSender(@Parent() transaction: Transaction) {
    return await this.accountService.getAccount(transaction.sender);
  }
}
