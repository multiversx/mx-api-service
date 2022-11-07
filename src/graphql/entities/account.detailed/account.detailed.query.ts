import { Args, Query, Resolver } from "@nestjs/graphql";

import { ApplyComplexity } from "@elrondnetwork/erdnest";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountService } from "src/endpoints/accounts/account.service";
import { GetAccountDetailedInput, GetAccountTokenRolesInput } from "src/graphql/entities/account.detailed/account.detailed.input";
import { NotFoundException } from "@nestjs/common";
import { TokenWithRoles } from "src/endpoints/tokens/entities/token.with.roles";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { QueryPagination } from "src/common/entities/query.pagination";

@Resolver()
export class AccountDetailedQuery {
  constructor(
    protected readonly accountService: AccountService,
    protected readonly tokenService: TokenService
  ) { }

  @Query(() => AccountDetailed, { name: "account", description: "Retrieve the detailed account for the given input.", nullable: true })
  @ApplyComplexity({ target: AccountDetailed })
  public async getAccountDetailed(@Args("input", { description: "Input to retrieve the given detailed account for." }) input: GetAccountDetailedInput): Promise<AccountDetailed | null> {
    const account = await this.accountService.getAccountSimple(GetAccountDetailedInput.resolve(input));

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  @Query(() => [TokenWithRoles], { name: "tokenWithRolesForAddress", description: "Retrieve the detailed account token roles for the given input.", nullable: true })
  public async getTokensWithRolesForAddress(@Args("input", { description: "Input to retrieve the given detailed account for." }) input: GetAccountTokenRolesInput): Promise<TokenWithRoles[]> {
    const account = await this.tokenService.getTokensWithRolesForAddress(
      input.address,
      new TokenWithRolesFilter({
        identifier: input.identifier,
        search: input.search,
        owner: input.owner,
        canMint: input.canMint,
        canBurn: input.canBurn,
      }), new QueryPagination({
        from: input.from,
        size: input.size,
      }));

    return account;
  }
}
