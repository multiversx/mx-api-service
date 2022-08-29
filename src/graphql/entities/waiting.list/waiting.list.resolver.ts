import { Resolver } from "@nestjs/graphql";
import { WaitingList } from "src/endpoints/waiting-list/entities/waiting.list";
import { WaitingListQuery } from "./waiting.list.query";
import { WaitingListService } from "src/endpoints/waiting-list/waiting.list.service";

@Resolver(() => WaitingList)
export class WaitingListResolver extends WaitingListQuery {
  constructor(waitingListService: WaitingListService) {
    super(waitingListService);
  }
}
