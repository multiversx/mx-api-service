import { Injectable } from "@nestjs/common";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { ApiUtils, RoundUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";

@Injectable()
export class RoundService {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly blsService: BlsService,
  ) { }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.indexerService.getRoundCount(filter);
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    const result = await this.indexerService.getRounds(filter);

    for (const item of result) {
      item.shard = item.shardId;
    }

    return result.map(item => ApiUtils.mergeObjects(new Round(), item));
  }

  async getRound(shard: number, round: number): Promise<RoundDetailed> {
    const result = await this.indexerService.getRound(shard, round);

    const epoch = RoundUtils.roundToEpoch(round);
    const publicKeys = await this.blsService.getPublicKeys(shard, epoch);

    result.shard = result.shardId;
    result.signers = result.signersIndexes.map((index: number) => publicKeys[index]);

    return ApiUtils.mergeObjects(new RoundDetailed(), result);
  }
}
