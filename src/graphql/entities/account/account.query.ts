import { Args, Float, Resolver, Query } from "@nestjs/graphql";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";
import { GetAccountFilteredInput, GetAccountsInput } from "src/graphql/entities/account/account.input";
import { ApplyComplexity } from "@multiversx/sdk-nestjs";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AccountFilter } from "src/endpoints/accounts/entities/account.filter";

@Resolver()
export class AccountQuery {
  constructor(protected readonly accountService: AccountService) { }

  @Query(() => [Account], { name: "accounts", description: "Retrieve all accounts for the given input." })
  @ApplyComplexity({ target: Account })
  public async getAccounts(@Args("input", { description: "Input to retrieve the given accounts for." }) input: GetAccountsInput): Promise<Account[]> {
    return await this.accountService.getAccounts(
      new QueryPagination({ from: input.from, size: input.size }), new AccountFilter({ ownerAddress: input.ownerAddress })
    );
  }

  @Query(() => Float, { name: "accountsCount", description: "Retrieve all accounts count." })
  public async getAccountsCount(@Args("input", { description: "Input to retrieve the given accounts for." }) input: GetAccountFilteredInput): Promise<number> {
    return await this.accountService.getAccountsCount(new AccountFilter({ ownerAddress: input.ownerAddress }));
  }
}
