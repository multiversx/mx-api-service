import { Resolver } from "@nestjs/graphql";
import { MiniBlockQuery } from "./mini.block.query";
import { MiniBlockDetailed } from "src/endpoints/miniblocks/entities/mini.block.detailed";
import { MiniBlockService } from "src/endpoints/miniblocks/mini.block.service";

@Resolver(() => MiniBlockDetailed)
export class MiniBlockResolver extends MiniBlockQuery {
  constructor(miniBlockService: MiniBlockService) {
    super(miniBlockService);
  }
}
