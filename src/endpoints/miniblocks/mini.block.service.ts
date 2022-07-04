import { ApiUtils } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";

@Injectable()
export class MiniBlockService {
  constructor(private readonly indexerService: ElasticIndexerService) { }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlockDetailed> {
    const result = await this.indexerService.getItem('miniblocks', 'miniBlockHash', miniBlockHash);

    return ApiUtils.mergeObjects(new MiniBlockDetailed(), result);
  }
}
