import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";
import { GetAccountsInput } from "src/graphql/entities/account/account.input";
import { ApplyComplexity } from "@elrondnetwork/erdnest";

@Resolver()
export class AccountQuery {
  constructor(protected readonly accountService: AccountService) { }

  @Query(() => [Account], { name: "accounts", description: "Retrieve all accounts for the given input." })
  @ApplyComplexity({ target: Account })
  public async getAccounts(@Args("input", { description: "Input to retrieve the given accounts for." }) input: GetAccountsInput): Promise<Account[]> {
    return await this.accountService.getAccounts(GetAccountsInput.resolve(input));
  }

  @Query(() => Float, { name: "accountsCount", description: "Retrieve all accounts count." })
  public async getAccountsCount(): Promise<number> {
    return await this.accountService.getAccountsCount();
  }
}
