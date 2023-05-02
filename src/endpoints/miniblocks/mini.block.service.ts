import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { IndexerService } from "src/common/indexer/indexer.service";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";
import { MiniBlockFilter } from "./entities/mini.block.filter";

@Injectable()
export class MiniBlockService {
  constructor(private readonly indexerService: IndexerService) { }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlockDetailed> {
    const result = await this.indexerService.getMiniBlock(miniBlockHash);
    return ApiUtils.mergeObjects(new MiniBlockDetailed(), result);
  }

  async getMiniBlocks(pagination: QueryPagination, filter: MiniBlockFilter): Promise<MiniBlockDetailed[]> {
    const results = await this.indexerService.getMiniBlocks(pagination, filter);
    return results.map(item => ApiUtils.mergeObjects(new MiniBlockDetailed(), item));
  }
}
