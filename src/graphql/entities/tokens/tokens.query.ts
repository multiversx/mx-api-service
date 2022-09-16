import { Args, Float, Query, Resolver } from "@nestjs/graphql";
import { TokenService } from "src/endpoints/tokens/token.service";
import { GetTokenInput, GetTokensCountInput, GetTokensInput } from "./tokens.input";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenDetailed } from "src/endpoints/tokens/entities/token.detailed";
import { NotFoundException } from "@nestjs/common";
import { TokenSupplyResult } from "src/endpoints/tokens/entities/token.supply.result";

@Resolver()
export class TokenQuery {
  constructor(protected readonly tokenService: TokenService) { }

  @Query(() => Float, { name: "tokensCount", description: "Retrieve all tokens count for the given input." })
  public async getTokenCount(@Args("input", { description: "Input to retrieve the given count for." }) input: GetTokensCountInput): Promise<Number> {
    return await this.tokenService.getTokenCount(
      new TokenFilter({
        search: input.search,
        name: input.name,
        identifier: input.identifier,
        identifiers: input.identifiers,
      }),
    );
  }

  @Query(() => [TokenDetailed], { name: "tokens", description: "Retrieve all tokens for the given input." })
  public async getTokens(@Args("input", { description: "Input to retrieve the given tokens for." }) input: GetTokensInput): Promise<TokenDetailed[]> {
    return await this.tokenService.getTokens(
      new QueryPagination({ from: input.from, size: input.size }),
      new TokenFilter({
        search: input.search,
        name: input.name,
        identifier: input.identifier,
        identifiers: input.identifiers,
        sort: input.sort,
        order: input.order,
      })
    );
  }

  @Query(() => TokenDetailed, { name: "token", description: "Retrieve token for the given input.", nullable: true })
  public async getToken(@Args("input", { description: "Input to retrieve the given token for." }) input: GetTokenInput): Promise<TokenDetailed | undefined> {
    const token = await this.tokenService.getToken(GetTokenInput.resolve(input));

    if (!token) {
      throw new NotFoundException('Token not found');
    }
    return token;
  }

  @Query(() => TokenSupplyResult, { name: "tokenSupply", description: "Retrieve token supply for the given input.", nullable: true })
  public async getTokenSupply(@Args("input", { description: "Input to retrieve the given token for." }) input: GetTokenInput): Promise<TokenSupplyResult | undefined> {
    const token = await this.tokenService.getTokenSupply(GetTokenInput.resolve(input));

    if (!token) {
      throw new NotFoundException('Token not found');
    }
    return token;
  }
}
