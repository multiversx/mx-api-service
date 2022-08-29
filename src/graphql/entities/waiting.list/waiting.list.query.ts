import { Float, Resolver, Query } from "@nestjs/graphql";
import { WaitingList } from "src/endpoints/waiting-list/entities/waiting.list";
import { WaitingListService } from "src/endpoints/waiting-list/waiting.list.service";


@Resolver()
export class WaitingListQuery {
  constructor(protected readonly waitingListService: WaitingListService) { }

  @Query(() => [WaitingList], { name: "waitingList", description: "Retrieve all address that are in waiting." })
  public async getWaitingList(): Promise<WaitingList[]> {
    return await this.waitingListService.getWaitingList();
  }

  @Query(() => Float, { name: "waitingListCount", description: "Retrieve all addresses count that are in waiting." })
  public async getWaitingListCount(): Promise<number> {
    return await this.waitingListService.getWaitingListCount();
  }
}
