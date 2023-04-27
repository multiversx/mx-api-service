import { ParseArrayPipe, ParseBlockHashPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";
import { MiniBlockFilter } from "./entities/mini.block.filter";
import { MiniBlockService } from "./mini.block.service";
import { ParseEnumPipe } from "@multiversx/sdk-nestjs-common/lib/pipes/parse.enum.pipe";
import { MiniBlockType } from "./entities/mini.block.type";

@Controller()
@ApiTags('miniblocks')
export class MiniBlockController {
  constructor(private readonly miniBlockService: MiniBlockService) { }

  @Get("/miniblocks")
  @ApiOperation({ summary: 'Miniblocks details', description: 'Returns all distinct miniblocks' })
  @ApiOkResponse({ type: [MiniBlockDetailed] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'hashes', description: 'Filter by a comma-separated list of miniblocks hashes', required: false })
  @ApiQuery({ name: 'type', description: 'Sorting criteria by type', required: false, enum: MiniBlockType })
  async getMiniBlocks(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('hashes', ParseArrayPipe) hashes?: string[],
    @Query('type', new ParseEnumPipe(MiniBlockType)) type?: MiniBlockType,
  ): Promise<MiniBlockDetailed[]> {
    return await this.miniBlockService.getMiniBlocks(new QueryPagination({ from, size }), new MiniBlockFilter({ hashes, type }));
  }

  @Get("/miniblocks/:miniBlockHash")
  @ApiOperation({ summary: 'Miniblock details', description: 'Returns miniblock details for a given miniBlockHash.' })
  @ApiOkResponse({ type: MiniBlockDetailed })
  @ApiNotFoundResponse({ description: 'Miniblock not found' })
  async getBlock(@Param('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string): Promise<MiniBlockDetailed> {
    try {
      return await this.miniBlockService.getMiniBlock(miniBlockHash);
    } catch {
      throw new HttpException('Miniblock not found', HttpStatus.NOT_FOUND);
    }
  }
}
