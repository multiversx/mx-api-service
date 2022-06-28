import { ApiUtils, ElasticService } from "@elrondnetwork/nestjs-microservice-common";
import { Injectable } from "@nestjs/common";
import { MiniBlockDetailed } from "./entities/mini.block.detailed";

@Injectable()
export class MiniBlockService {
  constructor(private readonly elasticService: ElasticService) { }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlockDetailed> {
    const result = await this.elasticService.getItem('miniblocks', 'miniBlockHash', miniBlockHash);

    return ApiUtils.mergeObjects(new MiniBlockDetailed(), result);
  }
}
