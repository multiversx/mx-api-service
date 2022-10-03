import { NotFoundException } from "@nestjs/common";
import { Args, Resolver, Query } from "@nestjs/graphql";
import { MexToken } from "src/endpoints/mex/entities/mex.token";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { GetMexTokenInput, GetMexTokensInput } from "./mex.token.input";

@Resolver()
export class MexTokensQuery {
  constructor(protected readonly mexTokenService: MexTokenService) { }

  @Query(() => [MexToken], { name: "mexTokens", description: "Retrieve all tokens listed on Maiar Exchange for the given input." })
  public async getMexTokens(@Args("input", { description: "Input to retrieve the given tokens for." }) input: GetMexTokensInput): Promise<MexToken[]> {
    return await this.mexTokenService.getMexTokens(GetMexTokensInput.resolve(input));
  }

  @Query(() => MexToken, { name: "mexToken", description: "Retrieve the mex token for the given input.", nullable: true })
  public async getNft(@Args("input", { description: "Input to retrieve the given NFT for." }) input: GetMexTokenInput): Promise<MexToken | undefined> {
    const token = await this.mexTokenService.getMexTokenByIdentifier(GetMexTokenInput.resolve(input));

    if (!token) {
      throw new NotFoundException('Mex token not found');
    }
    return token;
  }
}
