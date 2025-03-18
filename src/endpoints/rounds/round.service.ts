import { Injectable } from "@nestjs/common";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { RoundUtils } from "@multiversx/sdk-nestjs-common";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { IndexerService } from "src/common/indexer/indexer.service";
import { ApiConfigService } from "../../common/api-config/api.config.service";

@Injectable()
export class RoundService {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly blsService: BlsService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.indexerService.getRoundCount(filter);
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    if (this.apiConfigService.isChainAndromedaEnabled()) {
      filter.validator = undefined;
    }

    const result = await this.indexerService.getRounds(filter) as any;

    for (const item of result) {
      item.shard = item.shardId;
    }

    return result.map((item: any) => ApiUtils.mergeObjects(new Round(), item));
  }

  async getRound(shard: number, round: number): Promise<RoundDetailed> {
    const result = await this.indexerService.getRound(shard, round) as any;

    const epoch = RoundUtils.roundToEpoch(round);
    const publicKeys = await this.blsService.getPublicKeys(shard, epoch);

    result.shard = result.shardId;
    if (!this.apiConfigService.isChainAndromedaEnabled()) {
      result.signers = result.signersIndexes.map((index: number) => publicKeys[index]);
    } else {
      result.signers = publicKeys;
    }

    return ApiUtils.mergeObjects(new RoundDetailed(), result);
  }
}
