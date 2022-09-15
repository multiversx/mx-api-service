import { NotFoundException } from "@nestjs/common";
import { Args, Resolver, Query } from "@nestjs/graphql";
import { MexPair } from "src/endpoints/mex/entities/mex.pair";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { GetMexTokenPairsByQuotePairIdInput, GetMexTokenPairsInput } from "./mex.pairs.input";

@Resolver()
export class MexTokenPairsQuery {
  constructor(protected readonly mexTokenPairService: MexPairService) { }

  @Query(() => [MexPair], { name: "mexPairs", description: "Retrieve all mex token pairs listed on Maiar Exchange for the given input." })
  public async getMexPairs(@Args("input", { description: "Input to retrieve the given tokens for." }) input: GetMexTokenPairsInput): Promise<MexPair[]> {
    return await this.mexTokenPairService.getMexPairs(input.from, input.size);
  }

  @Query(() => MexPair, { name: "mexPair", description: "Retrieve one mex pair listed on Maiar Exchange for the given input." })
  public async getMexPair(@Args("input", { description: "Input to retrieve the given tokens mex pair for." }) input: GetMexTokenPairsByQuotePairIdInput): Promise<MexPair | undefined> {
    const mexPair = await this.mexTokenPairService.getMexPair(input.baseId, input.quoteId);

    if (!mexPair) {
      throw new NotFoundException('Mex pair not found');
    }

    return mexPair;
  }
}
