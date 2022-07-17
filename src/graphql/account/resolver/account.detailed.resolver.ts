import { Args, Resolver, Query, ResolveField, Parent, Float } from "@nestjs/graphql";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";
import { GetAccountInput } from "src/graphql/account/account.input.type";

@Resolver(() => AccountDetailed)
export class AccounteDetailedResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => AccountDetailed, { name: "account", description: "Retrieve the account for the given address.", nullable: true })
  public async getAccount(@Args("input", { description: "Input to retrieve the given account for." }) input: GetAccountInput): Promise<AccountDetailed | null> {
    return await this.accountService.getAccountOnly(GetAccountInput.resolve(input));
  }

  @ResolveField("txCount", () => Float, { name: "txCount", description: "Transactions count for the given account." })
  public async getTransactionCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountTxCount(account.address);
  }

  @ResolveField("scrCount", () => Float, { name: "scrCount", description: "Smart contracts count for the given account." })
  public async getSmartContractCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountScResults(account.address);
  }
}
