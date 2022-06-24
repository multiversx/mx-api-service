import { Injectable } from "@nestjs/common";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { ElasticService } from "src/common/elastic/elastic.service";
import { AbstractQuery } from "src/common/elastic/entities/abstract.query";
import { QueryType } from "src/common/elastic/entities/query.type";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ApiUtils, RoundUtils } from "@elrondnetwork/nestjs-microservice-template";

@Injectable()
export class RoundService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly blsService: BlsService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  private async buildElasticRoundsFilter(filter: RoundFilter): Promise<AbstractQuery[]> {
    const queries: AbstractQuery[] = [];

    if (filter.shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', filter.shard);
      queries.push(shardIdQuery);
    }

    if (filter.epoch !== undefined && !this.apiConfigService.getUseLegacyElastic()) {
      const epochQuery = QueryType.Match('epoch', filter.epoch);
      queries.push(epochQuery);
    }

    if (filter.validator !== undefined && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);

      const signersIndexesQuery = QueryType.Match('signersIndexes', index);
      queries.push(signersIndexesQuery);
    }

    return queries;
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, await this.buildElasticRoundsFilter(filter));

    return this.elasticService.getCount('rounds', elasticQuery);
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    const { from, size } = filter;

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(filter.condition ?? QueryConditionOptions.must, await this.buildElasticRoundsFilter(filter));

    const result = await this.elasticService.getList('rounds', 'round', elasticQuery);

    for (const item of result) {
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
