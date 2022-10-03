import { RoundService } from "src/endpoints/rounds/round.service";
import { Args, Float, Query, Resolver } from "@nestjs/graphql";
import { Round } from "src/endpoints/rounds/entities/round";
import { GetRoundInput, GetRoundsCountInput, GetRoundsInput } from "./rounds.input";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { RoundDetailed } from "src/endpoints/rounds/entities/round.detailed";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class RoundQuery {
  constructor(protected readonly roundService: RoundService) { }

  @Query(() => [Round], { name: "rounds", description: "Retrieve all rounds for the given input." })
  public async getRounds(@Args("input", { description: "Input to retrieve the given rounds for." }) input: GetRoundsInput): Promise<Round[]> {
    return await this.roundService.getRounds(
      new RoundFilter({
        from: input.from,
        size: input.size,
        validator: input.validator,
        shard: input.shard,
        epoch: input.epoch,
      }),
    );
  }

  @Query(() => Float, { name: "roundsCount", description: "Returns total number of rounds.", nullable: true })
  public async getBlocksCount(@Args("input", { description: "Input to retrieve the given rounds count for." }) input: GetRoundsCountInput): Promise<number> {
    return await this.roundService.getRoundCount(GetRoundsCountInput.resolve(input));
  }

  @Query(() => RoundDetailed, { name: "round", description: "Retrieve the round details for the given input.", nullable: true })
  public async getNode(@Args("input", { description: "Input to retrieve the given node for." }) input: GetRoundInput): Promise<RoundDetailed> {
    try {
      return await this.roundService.getRound(input.shard, input.round);
    } catch {
      throw new NotFoundException('Round not found');
    }
  }
}
