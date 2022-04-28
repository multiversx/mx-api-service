import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WaitingList } from './entities/waiting.list';
import { WaitingListService } from './waiting.list.service';

@Controller()
@ApiTags('waiting-list')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) { }

  @Get("/waiting-list")
  @ApiOperation({
    summary: 'Waiting list',
    description: 'Returns a list of all waiting accounts',
  })
  @ApiResponse({
    status: 200,
    isArray: true,
    type: WaitingList,
  })
  getWaitingList(): Promise<WaitingList[]> {
    return this.waitingListService.getWaitingList();
  }

  @Get("/waiting-list/count")
  @ApiOperation({
    summary: 'Waiting accounts count',
    description: 'Returns total number of accounts in waiting',
  })
  @ApiResponse({
    status: 200,
    type: Number,
  })
  getWaitingListCount(): Promise<number> {
    return this.waitingListService.getWaitingListCount();
  }

  @Get("/waiting-list/c")
  @ApiExcludeEndpoint()
  getWaitingListCountAlternative(): Promise<number> {
    return this.waitingListService.getWaitingListCount();
  }
}
