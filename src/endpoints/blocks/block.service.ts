import { Injectable } from "@nestjs/common";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { CachingService } from "src/common/caching/caching.service";
import { BlockFilter } from "./entities/block.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlsService } from "src/common/bls.service";
import { Constants } from "src/utils/constants";
import { ApiUtils } from "src/utils/api.utils";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { ElasticService } from "src/common/elastic/elastic.service";
import { AbstractQuery } from "src/common/elastic/entities/abstract.query";
import { QueryType } from "src/common/elastic/entities/query.type";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";

@Injectable()
export class BlockService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
    private readonly blsService: BlsService,
  ) {}

  private async buildElasticBlocksFilter (filter: BlockFilter): Promise<AbstractQuery[]> {
    const { shard, proposer, validator, epoch, nonce } = filter;

    const queries: AbstractQuery[] = [];
    if  (nonce !== undefined) {
      const nonceQuery = QueryType.Match("nonce", nonce);
      queries.push(nonceQuery);
    }
    if (shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', shard);
      queries.push(shardIdQuery);
    }
    
    if (epoch !== undefined) {
      const epochQuery = QueryType.Match('epoch', epoch);
      queries.push(epochQuery);
    }

    if (proposer && shard !== undefined && epoch !== undefined) {
      let index = await this.blsService.getBlsIndex(proposer, shard, epoch);
      const proposerQuery = QueryType.Match('proposer', index);
      queries.push(proposerQuery);
    }

    if (validator && shard !== undefined && epoch !== undefined) {
      let index = await this.blsService.getBlsIndex(validator, shard, epoch);
      const validatorsQuery = QueryType.Match('validators', index);
      queries.push(validatorsQuery);
    }

    return queries;
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, await this.buildElasticBlocksFilter(filter));

    return await this.cachingService.getOrSetCache(
      `blocks:count:${JSON.stringify(elasticQuery)}`,
      async () => await this.elasticService.getCount('blocks', elasticQuery),
      Constants.oneMinute()
    );
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    const { from, size } = queryPagination;
    
    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, await this.buildElasticBlocksFilter(filter));

    let result = await this.elasticService.getList('blocks', 'hash', elasticQuery);

    for (let item of result) {
      item.shard = item.shardId;
    }

    let blocks = [];

    for (let item of result) {
      let block = await this.computeProposerAndValidators(item);

      blocks.push(ApiUtils.mergeObjects(new Block(), block));
    }

    return blocks;
  }

  async computeProposerAndValidators(item: any) {
    // eslint-disable-next-line no-unused-vars
    let { shardId: shard, epoch, proposer, validators, searchOrder, ...rest } = item;

    let key = `${shard}_${epoch}`;
    let blses: any = await this.cachingService.getCacheLocal(key);
    if (!blses) {
      blses = await this.blsService.getPublicKeys(shard, epoch);

      await this.cachingService.setCacheLocal(key, blses, Constants.oneWeek());
    }
  
    proposer = blses[proposer];

    if (validators) {
      validators = validators.map((index: number) => blses[index]);
    }
  
    return { shard, epoch, proposer, validators, ...rest };
  };

  async getBlock(hash: string): Promise<BlockDetailed> {
    let result = await this.elasticService.getItem('blocks', 'hash', hash);

    let publicKeys = await this.blsService.getPublicKeys(result.shardId, result.epoch);
    result.shard = result.shardId;
    result.proposer = publicKeys[result.proposer];
    result.validators = result.validators.map((validator: number) => publicKeys[validator]);

    return ApiUtils.mergeObjects(new BlockDetailed(), result);
  }

  async getCurrentEpoch(): Promise<number> {
    let blocks = await this.getBlocks(new BlockFilter(), { from: 0, size: 1 });
    if (blocks.length === 0) {
      return -1;
    }

    return blocks[0].epoch;
  }
}