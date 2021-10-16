import { Injectable } from "@nestjs/common";
import { ElasticService } from "src/common/elastic.service";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { CachingService } from "src/common/caching.service";
import { BlockFilter } from "./entities/block.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticSortOrder } from "src/common/entities/elastic/elastic.sort.order";
import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { AbstractQuery } from "src/common/entities/elastic/abstract.query";
import { BlsService } from "src/common/bls.service";
import { QueryType } from "src/common/entities/elastic/query.type";
import { Constants } from "src/utils/constants";
import { ApiUtils } from "src/utils/api.utils";
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options";
import { GatewayService } from "src/common/gateway.service";

@Injectable()
export class BlockService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
    private readonly blsService: BlsService,
    private readonly gatewayService: GatewayService,
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
      item.gasUsed = await this.getBlockGasUsed(item.shard, item.hash);
      item.gasUsedPercentage = (item.gasUsed / Constants.maxGasPerTransaction * 100).toRounded(2);
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
    result.gasUsed = await this.getBlockGasUsed(result.shard, hash);
    result.gasUsedPercentage = (result.gasUsed / Constants.maxGasPerTransaction * 100).toRounded(2);

    return ApiUtils.mergeObjects(new BlockDetailed(), result);
  }

  private async getBlockGasUsed(shard: number, hash: string): Promise<number> {
    return this.cachingService.getOrSetCache(
      `blockGasUsed:${shard}:${hash}`,
      async () => await this.getBlockGasUsedRaw(shard, hash),
      Constants.oneWeek()
    )
  }

  private async getBlockGasUsedRaw(shard: number, hash: string): Promise<number> {
    let result = await this.gatewayService.get(`block/${shard}/by-hash/${hash}?withTxs=true`);

    if (!result || !result.block) {
      return 0;
    }

    if (result.block.miniBlocks === undefined) {
      return 0;
    }

    const totalGasUsed = result.block.miniBlocks
      .selectMany((x: any) => x.transactions)
      .filter((x: any) => x.gasLimit > 0)
      .map((x: any) => Number(x.gasLimit))
      .reduce((a: number, b: number) => a + b, 0)

    return totalGasUsed;
  }

  async getCurrentEpoch(): Promise<number> {
    let blocks = await this.getBlocks(new BlockFilter(), { from: 0, size: 1 });
    if (blocks.length === 0) {
      return -1;
    }

    return blocks[0].epoch;
  }
}