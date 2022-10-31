import { ParseBlockHashPipe } from "@elrondnetwork/erdnest";
import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";
import { MiniBlockService } from "./mini.block.service";

@Controller()
@ApiTags('miniblocks')
export class MiniBlockController {
  constructor(private readonly miniBlockService: MiniBlockService) { }

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
