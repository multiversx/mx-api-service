import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ParseBlockHashPipe } from "src/utils/pipes/parse.block.hash.pipe";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";
import { MiniBlockService } from "./mini.block.service";

@Controller()
@ApiTags('miniblocks')
export class MiniBlockController {
  constructor(private readonly miniBlockService: MiniBlockService) { }

  @Get("/miniblocks/:miniBlockHash")
  @ApiResponse({
    status: 200,
    description: 'The details of a given MiniBlock',
    type: MiniBlockDetailed,
  })
  @ApiResponse({
    status: 404,
    description: 'Miniblock not found',
  })
  async getBlock(@Param('miniBlockHash', ParseBlockHashPipe) miniBlockHash: string): Promise<MiniBlockDetailed> {
    try {
      return await this.miniBlockService.getMiniBlock(miniBlockHash);
    } catch {
      throw new HttpException('Miniblock not found', HttpStatus.NOT_FOUND);
    }
  }
}
