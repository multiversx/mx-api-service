import { Resolver, ResolveField, Parent, Float } from "@nestjs/graphql";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountDetailedQuery } from "src/graphql/entities/account.detailed/account.detailed.query";
import { AccountService } from "src/endpoints/accounts/account.service";

@Resolver(() => AccountDetailed)
export class AccountDetailedResolver extends AccountDetailedQuery {
  constructor(accountService: AccountService) {
    super(accountService);
  }

  @ResolveField("txCount", () => Float, { name: "txCount", description: "Transactions count for the given detailed account." })
  public async getTransactionCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountTxCount(account.address);
  }

  @ResolveField("scrCount", () => Float, { name: "scrCount", description: "Smart contracts count for the given detailed account." })
  public async getSmartContractCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountScResults(account.address);
  }
}
