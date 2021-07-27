import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/helpers/elastic.service";
import { Round } from "./entities/round";
import { mergeObjects, roundToEpoch } from "src/helpers/helpers";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { ElasticPagination } from "src/helpers/entities/elastic/elastic.pagination";
import { ElasticSortProperty } from "src/helpers/entities/elastic/elastic.sort.property";
import { ElasticSortOrder } from "src/helpers/entities/elastic/elastic.sort.order";
import { QueryCondition } from "src/helpers/entities/elastic/query.condition";

@Injectable()
export class RoundService {
  constructor(private readonly elasticService: ElasticService) {}

  private async buildElasticRoundsFilter(filter: RoundFilter): Promise<any> {
    const query: any = {
      shardId: filter.shard
    };

    if (filter.validator && filter.shard && filter.epoch) {
      const index = await this.elasticService.getBlsIndex(filter.validator, filter.shard, filter.epoch);

      if (index) {
        query.signersIndexes = index;
      } else {
        query.signersIndexes = -1;
      }
    }

    return query;
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    const query = await this.buildElasticRoundsFilter(filter);
    
    return this.elasticService.getCount('rounds', query);
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    const query = await this.buildElasticRoundsFilter(filter);

    const pagination: ElasticPagination = {
      from: filter.from,
      size: filter.size
    }

    const sorts: ElasticSortProperty[] = [];
    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descendant };
    sorts.push(timestamp);

    let result = await this.elasticService.getList('rounds', 'round', query, pagination, sorts, filter.condition ?? QueryCondition.must);

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