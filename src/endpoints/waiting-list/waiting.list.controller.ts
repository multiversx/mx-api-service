import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WaitingList } from './entities/waiting.list';
import { WaitingListService } from './waiting.list.service';

@Controller()
@ApiTags('waiting-list')
export class WaitingListController {
  constructor(private readonly waitingListService: WaitingListService) {}

  @Get("/waiting-list")
  @ApiResponse({
    status: 200,
    description: 'Waiting list',
    type: WaitingList,
    isArray: true
  })
  getWaitingList(): Promise<WaitingList[]> {
    return this.waitingListService.getWaitingList();
  }

  @Get("/waiting-list/count")
  getWaitingListCount(): Promise<number> {
    return this.waitingListService.getWaitingListCount();  
  }

  @Get("/waiting-list/c")
  @ApiExcludeEndpoint()
  getWaitingListCountAlternative(): Promise<number> {
    return this.waitingListService.getWaitingListCount();  
  }
}
