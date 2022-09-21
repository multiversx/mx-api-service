import { ParseIntPipe } from '@elrondnetwork/erdnest';
import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { WaitingList } from './entities/waiting.list';
import { WaitingListService } from './waiting.list.service';

@Controller()
@ApiTags('waiting-list')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) { }

  @Get("/waiting-list")
  @ApiOperation({ summary: 'Waiting list', description: 'Returns node waiting list' })
  @ApiOkResponse({ type: [WaitingList] })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getWaitingList(
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number
  ): Promise<WaitingList[]> {
    return this.waitingListService.getWaitingList(new QueryPagination({ from, size }));
  }

  @Get("/waiting-list/count")
  @ApiOperation({ summary: 'Waiting list count', description: 'Returns count of node waiting list' })
  @ApiOkResponse({ type: Number })
  getWaitingListCount(): Promise<number> {
    return this.waitingListService.getWaitingListCount();
  }

  @Get("/waiting-list/c")
  @ApiExcludeEndpoint()
  getWaitingListCountAlternative(): Promise<number> {
    return this.waitingListService.getWaitingListCount();
  }
}
