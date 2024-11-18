import { Controller, DefaultValuePipe, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { QueryPagination } from '../../common/entities/query.pagination';
import { ParseAddressPipe, ParseIntPipe } from '@multiversx/sdk-nestjs-common';

import { Events } from './entities/events';
import { EventsFilter } from './entities/events.filter';

@Controller()
@ApiTags('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) { }

  @Get('/events')
  @ApiOperation({ summary: 'Events', description: 'Returns events' })
  @ApiOkResponse({ type: [Events] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'address', description: 'Event address', required: false })
  @ApiQuery({ name: 'identifier', description: 'Event identifier', required: false })
  @ApiQuery({ name: 'txHash', description: 'Event transaction hash', required: false })
  @ApiQuery({ name: 'shard', description: 'Event shard id', required: false })
  @ApiQuery({ name: 'before', description: 'Event before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'Event after timestamp', required: false })
  async getEvents(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('address', ParseAddressPipe) address: string,
    @Query('identifier') identifier: string,
    @Query('txHash') txHash: string,
    @Query('shard', ParseIntPipe) shard: number,
    @Query('before', ParseIntPipe) before: number,
    @Query('after', ParseIntPipe) after: number,
  ): Promise<Events[]> {
    return await this.eventsService.getEvents(
      new QueryPagination({ from, size }),
      new EventsFilter({ address, identifier, txHash, shard, after, before }));
  }

  @Get('/events/count')
  @ApiOperation({ summary: 'Events count', description: 'Returns events count' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'address', description: 'Event address', required: false })
  @ApiQuery({ name: 'identifier', description: 'Event identifier', required: false })
  @ApiQuery({ name: 'txHash', description: 'Event transaction hash', required: false })
  @ApiQuery({ name: 'shard', description: 'Event shard id', required: false })
  @ApiQuery({ name: 'before', description: 'Event before timestamp', required: false })
  @ApiQuery({ name: 'after', description: 'Event after timestamp', required: false })
  async getEventsCount(
    @Query('address', ParseAddressPipe) address: string,
    @Query('identifier') identifier: string,
    @Query('txHash') txHash: string,
    @Query('shard', ParseIntPipe) shard: number,
    @Query('before', ParseIntPipe) before: number,
    @Query('after', ParseIntPipe) after: number,
  ): Promise<number> {
    return await this.eventsService.getEventsCount(
      new EventsFilter({ address, identifier, txHash, shard, after, before }));
  }

  @Get('/events/:txHash')
  @ApiOperation({ summary: 'Event', description: 'Returns event' })
  @ApiOkResponse({ type: Events })
  async getEvent(
    @Param('txHash') txHash: string,
  ): Promise<Events | undefined> {
    const result = await this.eventsService.getEvent(txHash);

    if (!result) {
      throw new NotFoundException('Event not found');
    }

    return result;
  }
}
