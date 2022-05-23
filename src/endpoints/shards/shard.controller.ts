import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ShardService } from "./shard.service";
import { Shard } from "./entities/shard";

@Controller()
@ApiTags('shards')
export class ShardController {
  constructor(private readonly shardService: ShardService) { }

  @Get("/shards")
  @ApiOperation({ summary: 'Shards', description: 'Returns all available shards' })
  @ApiOkResponse({ type: [Shard] })

  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getShards(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<Shard[]> {
    return await this.shardService.getShards({ from, size });
  }
}
