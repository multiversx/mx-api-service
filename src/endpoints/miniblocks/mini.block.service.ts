import { ApiUtils } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { IndexerService } from "src/common/indexer/indexer.service";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";

@Injectable()
export class MiniBlockService {
  constructor(private readonly indexerService: IndexerService) { }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlockDetailed> {
    const result = await this.indexerService.getItem('miniblocks', 'miniBlockHash', miniBlockHash);

    return ApiUtils.mergeObjects(new MiniBlockDetailed(), result);
  }
}
