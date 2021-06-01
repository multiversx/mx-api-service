import { Injectable } from "@nestjs/common";
import { ElasticPagination } from "src/helpers/entities/elastic.pagination";
import { ElasticService } from "src/helpers/elastic.service";
import { Round } from "./entities/round";
import { mergeObjects, roundToEpoch } from "src/helpers/helpers";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundQuery } from "./entities/round.query";
import { QueryCondition } from "src/helpers/entities/query.condition";

@Injectable()
export class RoundService {
  constructor(private readonly elasticService: ElasticService) {}

  async getRoundCount(): Promise<number> {
    return this.elasticService.getCount('rounds');
  }

  async getRounds(roundQuery: RoundQuery): Promise<Round[]> {
    const query: any = {
      shardId: roundQuery.shard
    };

    if (roundQuery.validator && roundQuery.shard && roundQuery.epoch) {
      const index = await this.elasticService.getBlsIndex(roundQuery.validator, roundQuery.shard, roundQuery.epoch);

      if (index) {
        query.signersIndexes = index;
      } else {
        query.signersIndexes = -1;
      }
    }

    const pagination: ElasticPagination = {
      from: roundQuery.from,
      size: roundQuery.size
    }

    const sort = {
      timestamp: 'desc',
    };

    let result = await this.elasticService.getList('rounds', 'round', query, pagination, sort, roundQuery.condition ?? QueryCondition.must);

    for (let item of result) {
      item.shard = item.shardId;
    }

    return result.map(item => mergeObjects(new Round(), item));
  }

  async getRound(shard: number, round: number): Promise<RoundDetailed> {
    const result = await this.elasticService.getItem('rounds', 'round', `${shard}_${round}`);

    const epoch = roundToEpoch(round);
    const publicKeys = await this.elasticService.getPublicKeys(shard, epoch);

    result.shard = result.shardId;
    result.signers = result.signersIndexes.map((index: number) => publicKeys[index]);

    return mergeObjects(new RoundDetailed(), result);
  }
}