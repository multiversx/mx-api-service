import { Args, Query, Resolver } from "@nestjs/graphql";

import { ApplyComplexity } from "@elrondnetwork/erdnest";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";
import { GetAccountDetailedInput } from "src/graphql/entities/account.detailed/account.detailed.input";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class AccountDetailedQuery {
  constructor(protected readonly accountService: AccountService) { }

  @Query(() => AccountDetailed, { name: "account", description: "Retrieve the detailed account for the given input.", nullable: true })
  @ApplyComplexity({ target: AccountDetailed })
  public async getAccountDetailed(@Args("input", { description: "Input to retrieve the given detailed account for." }) input: GetAccountDetailedInput): Promise<AccountDetailed | null> {
    const account = await this.accountService.getAccountSimple(GetAccountDetailedInput.resolve(input));

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }
}
