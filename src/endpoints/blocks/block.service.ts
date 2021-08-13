import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/helpers/elastic.service";
import { mergeObjects } from "src/helpers/helpers";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { CachingService } from "src/helpers/caching.service";
import { BlockFilter } from "./entities/block.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticPagination } from "src/helpers/entities/elastic/elastic.pagination";
import { ElasticSortProperty } from "src/helpers/entities/elastic/elastic.sort.property";
import { ElasticSortOrder } from "src/helpers/entities/elastic/elastic.sort.order";
import { ElasticQuery } from "src/helpers/entities/elastic/elastic.query";
import { AbstractQuery } from "src/helpers/entities/elastic/abstract.query";
import { BlsService } from "src/helpers/bls.service";
import { QueryType } from "src/helpers/entities/elastic/query.type";
import { Constants } from "src/utils/constants";

@Injectable()
export class BlockService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
    private readonly blsService: BlsService,
  ) {}

  private async buildElasticBlocksFilter (filter: BlockFilter): Promise<AbstractQuery[]> {
    const { shard, proposer, validator, epoch } = filter;

    const queries: AbstractQuery[] = [];
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
      const proposerQuery = QueryType.Match('proposer', index !== false ? index : -1);
      queries.push(proposerQuery);
    }

    if (validator && shard !== undefined && epoch !== undefined) {
      let index = await this.blsService.getBlsIndex(validator, shard, epoch);
      const validatorsQuery = QueryType.Match('validators', index !== false ? index : -1);
      queries.push(validatorsQuery);
    }

    return queries;
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.must = await this.buildElasticBlocksFilter(filter)

    return await this.cachingService.getOrSetCache(
      `blocks:count:${JSON.stringify(elasticQueryAdapter)}`,
      async () => await this.elasticService.getCount('blocks', elasticQueryAdapter),
      Constants.oneMinute()
    );
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();

    const { from, size } = queryPagination;
    const pagination: ElasticPagination = { 
      from, size 
    };
    elasticQueryAdapter.pagination = pagination;
    elasticQueryAdapter.condition.must = await this.buildElasticBlocksFilter(filter);

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [timestamp];

    let result = await this.elasticService.getList('blocks', 'hash', elasticQueryAdapter);

    for (let item of result) {
      item.shard = item.shardId;
    }

    let finalResult = [];

    for (let item of result) {
      let transformedItem = await this.transformItem(item);

      finalResult.push(transformedItem);
    }

    return finalResult.map(item => mergeObjects(new Block(), item));
  }

  async transformItem(item: any) {
    // eslint-disable-next-line no-unused-vars
    let { shardId: shard, epoch, proposer, validators, searchOrder, ...rest } = item;

    let key = `${shard}_${epoch}`;
    let blses: any = await this.cachingService.getCacheLocal(key);
    if (!blses) {
      blses = await this.blsService.getBlses(shard, epoch);

      await this.cachingService.setCacheLocal(key, blses, Constants.oneWeek());
    }
  
    proposer = blses[proposer];
    validators = validators.map((index: number) => blses[index]);
  
    return { shard, epoch, proposer, validators, ...rest };
  };

  async getBlock(hash: string): Promise<BlockDetailed> {
    let result = await this.elasticService.getItem('blocks', 'hash', hash);

    let publicKeys = await this.blsService.getPublicKeys(result.shardId, result.epoch);
    result.shard = result.shardId;
    result.proposer = publicKeys[result.proposer];
    result.validators = result.validators.map((validator: number) => publicKeys[validator]);

    return mergeObjects(new BlockDetailed(), result);
  }

  async getCurrentEpoch(): Promise<number> {
    let blocks = await this.getBlocks(new BlockFilter(), { from: 0, size: 1 });
    if (blocks.length === 0) {
      return -1;
    }

    return blocks[0].epoch;
  }
}