import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/helpers/elastic.service";
import { mergeObjects } from "src/helpers/helpers";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";

@Injectable()
export class MiniBlockService {
  constructor(private readonly elasticService: ElasticService) {}

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlockDetailed> {
    let result = await this.elasticService.getItem('miniblocks', 'miniBlockHash', miniBlockHash);

    return mergeObjects(new MiniBlockDetailed(), result);
  }
}