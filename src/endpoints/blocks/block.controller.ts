import { ParseArrayPipe, ParseBlockHashPipe, ParseBlsHashPipe, ParseBoolPipe, ParseEnumPipe, ParseIntPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, HttpException, NotFoundException, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockService } from "./block.service";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { BlockFilter } from "./entities/block.filter";
import { SortOrder } from "src/common/entities/sort.order";

@Controller()
@ApiTags('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) { }

  @Get("/blocks")
  @ApiOperation({ summary: 'Blocks', description: 'Returns a list of all blocks from all shards' })
  @ApiOkResponse({ type: [Block] })
  @ApiQuery({ name: 'shard', description: 'Id of the shard the block belongs to', required: false })
  @ApiQuery({ name: 'proposer', description: 'Filter by proposer', required: false })
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch', required: false })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'nonce', description: 'Filter by nonce', required: false })
  @ApiQuery({ name: 'hashes', description: 'Search by blocks hashes, comma-separated', required: false })
  @ApiQuery({ name: 'order', description: 'Order blocks (asc/desc) by timestamp', required: false, enum: SortOrder })
  @ApiQuery({ name: 'withProposerIdentity', description: 'Provide identity information for proposer node', required: false })
  getBlocks(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseIntPipe) epoch?: number,
    @Query('nonce', ParseIntPipe) nonce?: number,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('order', new ParseEnumPipe(SortOrder)) order?: SortOrder,
    @Query('withProposerIdentity', ParseBoolPipe) withProposerIdentity?: boolean,
  ): Promise<Block[]> {
    return this.blockService.getBlocks(
      new BlockFilter(
        { shard, proposer, validator, epoch, nonce, hashes, order }),
      new QueryPagination(
        { from, size }), withProposerIdentity);
  }

  @Get("/blocks/count")
  @ApiOperation({ summary: 'Blocks count', description: 'Returns count of all blocks from all shards' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'shard', description: 'Id of the shard the block belongs to', required: false })
  @ApiQuery({ name: 'proposer', description: 'Filter by proposer', required: false })
  @ApiQuery({ name: 'validator', description: 'Filter by validator', required: false })
  @ApiQuery({ name: 'epoch', description: 'Filter by epoch', required: false })
  @ApiQuery({ name: 'nonce', description: 'Filter by nonce', required: false })
  getBlocksCount(
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseIntPipe) epoch?: number,
    @Query('nonce', ParseIntPipe) nonce?: number,
  ): Promise<number> {
    return this.blockService.getBlocksCount(new BlockFilter({ shard, proposer, validator, epoch, nonce }));
  }

  @Get("/blocks/c")
  @ApiExcludeEndpoint()
  getBlocksCountAlternative(
    @Query('shard', ParseIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseIntPipe) epoch?: number,
    @Query('nonce', ParseIntPipe) nonce?: number,
  ): Promise<number> {
    return this.blockService.getBlocksCount(new BlockFilter({ shard, proposer, validator, epoch, nonce }));
  }

  @Get("/blocks/latest")
  @ApiOperation({ summary: 'Block details', description: 'Returns latest block information details' })
  @ApiOkResponse({ type: BlockDetailed })
  @ApiNotFoundResponse({ description: 'Block not found' })
  @ApiQuery({ name: 'ttl', description: 'Compute the nonce frequency based on ttl value. If not specified the latest block may be 1h old', required: false })
  async getLatestBlock(
    @Query('ttl', ParseIntPipe) ttl?: number,
  ): Promise<Block> {
    const block = await this.blockService.getLatestBlock(ttl);
    if (!block) {
      throw new NotFoundException("Block not found");
    }

    return block;
  }

  @Get("/blocks/:hash")
  @ApiOperation({ summary: 'Block details', description: 'Returns block information details for a given hash' })
  @ApiOkResponse({ type: BlockDetailed })
  @ApiNotFoundResponse({ description: 'Block not found' })
  async getBlock(@Param('hash', ParseBlockHashPipe) hash: string): Promise<BlockDetailed> {
    try {
      return await this.blockService.getBlock(hash);
    } catch {
      throw new HttpException('Block not found', HttpStatus.NOT_FOUND);
    }
  }
}
