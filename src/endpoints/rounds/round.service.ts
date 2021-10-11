import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/common/elastic.service";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { ElasticPagination } from "src/common/entities/elastic/elastic.pagination";
import { ElasticSortProperty } from "src/common/entities/elastic/elastic.sort.property";
import { ElasticSortOrder } from "src/common/entities/elastic/elastic.sort.order";
import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { AbstractQuery } from "src/common/entities/elastic/abstract.query";
import { BlsService } from "src/common/bls.service";
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options";
import { QueryType } from "src/common/entities/elastic/query.type";
import { RoundUtils } from "src/utils/round.utils";
import { ApiUtils } from "src/utils/api.utils";

@Injectable()
export class RoundService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly blsService: BlsService
  ) {}

  private async buildElasticRoundsFilter(filter: RoundFilter): Promise<AbstractQuery[]> {
    const queries: AbstractQuery[] = [];

    if (filter.shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', filter.shard);
      queries.push(shardIdQuery);
    }

    // if (filter.epoch !== undefined) {
    //   const epochQuery = QueryType.Match('epoch', filter.epoch);
    //   queries.push(epochQuery);
    // }
    
    if (filter.validator !== undefined && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);

      const signersIndexesQuery = QueryType.Match('signersIndexes', index);
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

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [timestamp];

    let result = await this.elasticService.getList('rounds', 'round', elasticQueryAdapter);

    for (let item of result) {
      item.shard = item.shardId;
    }

    return result.map(item => ApiUtils.mergeObjects(new Round(), item));
  }

  async getRound(shard: number, round: number): Promise<RoundDetailed> {
    const result = await this.elasticService.getItem('rounds', 'round', `${shard}_${round}`);

    const epoch = RoundUtils.roundToEpoch(round);
    const publicKeys = await this.blsService.getPublicKeys(shard, epoch);

    result.shard = result.shardId;
    result.signers = result.signersIndexes.map((index: number) => publicKeys[index]);

    return ApiUtils.mergeObjects(new RoundDetailed(), result);
  }
}