import { Args, Resolver, Query, Float } from "@nestjs/graphql";
import { GetBlockHashInput, GetBlocksCountInput, GetBlocksInput } from "./block.input";
import { BlockService } from "src/endpoints/blocks/block.service";
import { Block } from "src/endpoints/blocks/entities/block";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { BlockDetailed } from "src/endpoints/blocks/entities/block.detailed";

@Resolver()
export class BlockQuery {
  constructor(protected readonly blockService: BlockService) { }

  @Query(() => [Block], { name: "blocks", description: "Retrieve all blocks for the given input." })
  public async getBlocks(@Args("input", { description: "Input to retrieve the given blocks for." }) input: GetBlocksInput): Promise<Block[]> {
    return await this.blockService.getBlocks(
      new BlockFilter({
        shard: input.shard,
        proposer: input.proposer,
        validator: input.validator,
        epoch: input.epoch,
        nonce: input.nonce,
      }),
      new QueryPagination({ from: input.from, size: input.size }),
    );
  }


  @Query(() => Float, { name: "blocksCount", description: "Retrieve the all blocks count for the given input.", nullable: true })
  public async getBlocksCount(@Args("input", { description: "Input to retrieve the given blocks count for." }) input: GetBlocksCountInput): Promise<number> {
    return await this.blockService.getBlocksCount(GetBlocksCountInput.resolve(input));
  }

  @Query(() => BlockDetailed, { name: "blockHash", description: "Retrieve the block for the given input." })
  public async getBlock(@Args("input", { description: "Input to retrieve the given block hash details for." }) input: GetBlockHashInput): Promise<BlockDetailed> {
    return await this.blockService.getBlock(GetBlockHashInput.resolve(input));
  }
}
