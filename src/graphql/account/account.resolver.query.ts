import { Args, Int, Resolver, Query } from "@nestjs/graphql";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";

@Resolver(() => Account)
export class AccountQueryResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => [Account], { name: "accounts", description: "Retrieve all accounts available." })
  public async getAccounts(
    @Args("skip", { type: () => Int, description: "Number of accounts to skip for the given result set.", nullable: true, defaultValue: 0 }) from: number,
    @Args("size", { type: () => Int, description: "Number of accounts to retrieve for the given result set.", nullable: true, defaultValue: 25  }) size: number
    ): Promise<Account[]> {
      return await this.accountService.getAccounts({ from, size });
  }

  @Query(() => Int, { name: "accountsCount", description: "Retrieve all available accounts total count." })
  public async getAccountsCount(): Promise<number> {
    return await this.accountService.getAccountsCount();
  }

  @Query(() => AccountDetailed, { name: "account", description: "Retrieve the account for the given address.", nullable: true })
  public async getAccount(@Args("address", { type: () => String, description: "Address to retrieve the corresponding account." }) address: string): Promise<AccountDetailed | null> {
    return await this.accountService.getAccount(address);
  }
}
