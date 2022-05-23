import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ParseBlockHashPipe } from "src/utils/pipes/parse.block.hash.pipe";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";
import { MiniBlockService } from "./mini.block.service";

@Controller()
@ApiTags('miniblocks')
export class MiniBlockController {
  constructor(private readonly miniBlockService: MiniBlockService) { }

  @Get("/miniblocks/:miniBlockHash")
  @ApiOperation({ summary: 'Miniblock details', description: 'Returns miniblock details for a given identifier.' })
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
