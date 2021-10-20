import { Injectable, Logger } from "@nestjs/common";
import { Round } from "./entities/round";
import { RoundDetailed } from "./entities/round.detailed";
import { RoundFilter } from "./entities/round.filter";
import { BlsService } from "src/common/bls.service";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { RoundUtils } from "src/utils/round.utils";
import { ApiUtils } from "src/utils/api.utils";
import { ElasticService } from "src/common/elastic/elastic.service";
import { Constants } from "src/utils/constants";
import { CachingService } from "src/common/caching/caching.service";
import { AbstractQuery } from "src/common/elastic/entities/abstract.query";
import { QueryType } from "src/common/elastic/entities/query.type";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { GenesisTimestampInterface } from "src/utils/genesis.timestamp.interface";

@Injectable()
export class RoundService implements GenesisTimestampInterface{
  private readonly logger: Logger
  constructor(
    private readonly elasticService: ElasticService,
    private readonly blsService: BlsService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(RoundService.name);
  }

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

    let result = await this.elasticService.getList('rounds', 'round', elasticQuery);

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

  async getSecondsRemainingUntilNextRound(): Promise<number> {
    let genesisTimestamp = await this.getGenesisTimestamp();
    let currentTimestamp = Math.round(Date.now() / 1000);

    let result = 6 - (currentTimestamp - genesisTimestamp) % 6;
    if (result === 6) {
      result = 0;
    }

    return result;
  }

  private async getGenesisTimestamp(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'genesisTimestamp',
      async () => await this.getGenesisTimestampRaw(),
      Constants.oneWeek(),
      Constants.oneWeek()
    );
  }

  private async getGenesisTimestampRaw(): Promise<number> {
    try {
      let round = await this.getRound(0, 1);
      return round.timestamp;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }
}