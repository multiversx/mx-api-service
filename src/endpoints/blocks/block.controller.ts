import { ParseBlockHashPipe, ParseBlsHashPipe, ParseOptionalIntPipe } from "@elrondnetwork/nestjs-microservice-common";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { BlockService } from "./block.service";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";

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
  getBlocks(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseOptionalIntPipe) epoch?: number,
    @Query('nonce', ParseOptionalIntPipe) nonce?: number,
  ): Promise<Block[]> {
    return this.blockService.getBlocks({ shard, proposer, validator, epoch, nonce }, { from, size });
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
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseOptionalIntPipe) epoch?: number,
    @Query('nonce', ParseOptionalIntPipe) nonce?: number,
  ): Promise<number> {
    return this.blockService.getBlocksCount({ shard, proposer, validator, epoch, nonce });
  }

  @Get("/blocks/c")
  @ApiExcludeEndpoint()
  getBlocksCountAlternative(
    @Query('shard', ParseOptionalIntPipe) shard?: number,
    @Query('proposer', ParseBlsHashPipe) proposer?: string,
    @Query('validator', ParseBlsHashPipe) validator?: string,
    @Query('epoch', ParseOptionalIntPipe) epoch?: number,
    @Query('nonce', ParseOptionalIntPipe) nonce?: number,
  ): Promise<number> {
    return this.blockService.getBlocksCount({ shard, proposer, validator, epoch, nonce });
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
