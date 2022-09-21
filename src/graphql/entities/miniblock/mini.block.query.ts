import { Args, Resolver, Query } from "@nestjs/graphql";
import { GetMiniBlockHashInput } from "./mini.block.input";
import { MiniBlockService } from "src/endpoints/miniblocks/mini.block.service";
import { MiniBlockDetailed } from "src/endpoints/miniblocks/entities/mini.block.detailed";
import { NotFoundException } from "@nestjs/common";

@Resolver()
export class MiniBlockQuery {
  constructor(protected readonly miniBlockService: MiniBlockService) { }

  @Query(() => MiniBlockDetailed, { name: "miniBlockHash", description: "Retrieve the mini block hash for the given input." })
  public async getMiniBlockHash(@Args("input", { description: "Input to retrieve the given mini block hash details for." }) input: GetMiniBlockHashInput): Promise<MiniBlockDetailed> {

    try {
      return await this.miniBlockService.getMiniBlock(GetMiniBlockHashInput.resolve(input));
    } catch {
      throw new NotFoundException('Miniblock not found');
    }
  }
}
