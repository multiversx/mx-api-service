import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";
import { Fields } from "src/graphql/common/decorator/fields.decorator";
import { GetAccountInput, GetAccountsInput } from "src/graphql/account/account.input.type";

@Resolver(() => Account)
export class AccountQueryResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => [Account], { name: "accounts", description: "Retrieve all accounts available." })
  public async getAccounts(@Args("input", { description: "Get accounts input." }) input: GetAccountsInput): Promise<Account[]> {
      return await this.accountService.getAccounts(GetAccountsInput.resolve(input));
  }

  @Query(() => Float, { name: "accountsCount", description: "Retrieve all available accounts total count." })
  public async getAccountsCount(): Promise<number> {
    return await this.accountService.getAccountsCount();
  }

  @Query(() => AccountDetailed, { name: "account", description: "Retrieve the account for the given address.", nullable: true })
  public async getAccount(@Args("input", { description: "Get account input." }) input: GetAccountInput, @Fields() fields: string[]): Promise<AccountDetailed | null> {
    return await this.accountService.getAccount(GetAccountInput.resolve(input), fields);
  }
}
