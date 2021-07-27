import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/helpers/elastic.service";
import { Round } from "./entities/round";
import { mergeObjects, roundToEpoch } from "src/helpers/helpers";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { ElasticPagination } from "src/helpers/entities/elastic/elastic.pagination";
import { ElasticSortProperty } from "src/helpers/entities/elastic/elastic.sort.property";
import { ElasticSortOrder } from "src/helpers/entities/elastic/elastic.sort.order";
import { ElasticQuery } from "src/helpers/entities/elastic/elastic.query";
import { AbstractQuery } from "src/helpers/entities/elastic/abstract.query";
import { MatchQuery } from "src/helpers/entities/elastic/match.query";
import { BlsService } from "src/helpers/bls.service";
import { QueryConditionOptions } from "src/helpers/entities/elastic/query.condition.options";

@Injectable()
export class RoundService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly blsService: BlsService
  ) {}

  private async buildElasticRoundsFilter(filter: RoundFilter): Promise<AbstractQuery[]> {
    const queries: AbstractQuery[] = [];

    if (filter.shard) {
      const shardIdQuery = new MatchQuery('shardId', filter.shard, undefined).getQuery();
      queries.push(shardIdQuery);
    }
    
    if (filter.validator && filter.shard && filter.epoch) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);

      const signersIndexesQuery = new MatchQuery('signersIndexes', index !== false ? index : -1, undefined).getQuery();
      queries.push(signersIndexesQuery);
    }

    return queries;
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.must = await this.buildElasticRoundsFilter(filter)

    return this.elasticService.getCount('rounds', elasticQueryAdapter);
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    
    const { from, size } = filter;
    const pagination: ElasticPagination = { 
      from, size 
    };
    elasticQueryAdapter.pagination = pagination;

    elasticQueryAdapter.condition[filter.condition ?? QueryConditionOptions.must] = await this.buildElasticRoundsFilter(filter);

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descendant };
    elasticQueryAdapter.sort = [timestamp];

    let result = await this.elasticService.getList('rounds', 'round', elasticQueryAdapter);

    for (let item of result) {
      item.shard = item.shardId;
    }

    return result.map(item => mergeObjects(new Round(), item));
  }

  async getRound(shard: number, round: number): Promise<RoundDetailed> {
    const result = await this.elasticService.getItem('rounds', 'round', `${shard}_${round}`);

    const epoch = roundToEpoch(round);
    const publicKeys = await this.blsService.getPublicKeys(shard, epoch);

    result.shard = result.shardId;
    result.signers = result.signersIndexes.map((index: number) => publicKeys[index]);

    return mergeObjects(new RoundDetailed(), result);
  }
}