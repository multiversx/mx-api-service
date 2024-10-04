import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { QueryPagination } from '../../common/entities/query.pagination';
import {  ParseIntPipe } from '@multiversx/sdk-nestjs-common';
import { Events } from './entities/events';
import { EventsFilter } from './entities/events.filter';

@Controller()
@ApiTags('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Get('/events')
  @ApiOperation({ summary: 'Collections', description: 'Returns events' })
  @ApiOkResponse({ type: [Events] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  async getEvents(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('identifier') identifier: string,
    @Query('txHash') txHash: string,
    @Query('shard', ParseIntPipe) shard: number,
    @Query('before', ParseIntPipe) before: number,
    @Query('after', ParseIntPipe) after: number,
  ): Promise<Events[]> {
    return await this.eventsService.getEvents(
      new QueryPagination({ from, size }),
      new EventsFilter({ identifier, txHash, shard, after, before }));
  }
}
