import { Resolver } from "@nestjs/graphql";
import { BlockQuery } from "./block.query";
import { Block } from "src/endpoints/blocks/entities/block";
import { BlockService } from "src/endpoints/blocks/block.service";

@Resolver(() => Block)
export class BlockResolver extends BlockQuery {
  constructor(blockService: BlockService) {
    super(blockService);
  }
}
