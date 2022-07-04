import { Injectable } from "@nestjs/common";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { BlockFilter } from "./entities/block.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlsService } from "src/endpoints/bls/bls.service";
import { CacheInfo } from "src/utils/cache.info";
import { AbstractQuery, CachingService, Constants, ElasticQuery, ElasticSortOrder, QueryConditionOptions, QueryType } from "@elrondnetwork/erdnest";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";

@Injectable()
export class BlockService {
  constructor(
    private readonly indexerService: ElasticIndexerService,
    private readonly cachingService: CachingService,
    private readonly blsService: BlsService,
  ) { }

  private async buildElasticBlocksFilter(filter: BlockFilter): Promise<AbstractQuery[]> {
    const { shard, proposer, validator, epoch, nonce } = filter;

    const queries: AbstractQuery[] = [];
    if (nonce !== undefined) {
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
      const index = await this.blsService.getBlsIndex(proposer, shard, epoch);
      const proposerQuery = QueryType.Match('proposer', index);
      queries.push(proposerQuery);
    }

    if (validator && shard !== undefined && epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(validator, shard, epoch);
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
      async () => await this.indexerService.getCount('blocks', elasticQuery),
      Constants.oneMinute()
    );
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination(queryPagination)
      .withSort([
        { name: 'timestamp', order: ElasticSortOrder.descending },
        { name: 'shardId', order: ElasticSortOrder.ascending },
      ])
      .withCondition(QueryConditionOptions.must, await this.buildElasticBlocksFilter(filter));

    const result = await this.indexerService.getList('blocks', 'hash', elasticQuery);

    const blocks = [];
    for (const item of result) {
      const blockRaw = await this.computeProposerAndValidators(item);

      const block = Block.mergeWithElasticResponse(new Block(), blockRaw);
      blocks.push(block);
    }

    return blocks;
  }

  async computeProposerAndValidators(item: any) {
    const { shardId, epoch, searchOrder, ...rest } = item;
    let { proposer, validators } = item;

    let blses: any = await this.cachingService.getCacheLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key);
    if (!blses) {
      blses = await this.blsService.getPublicKeys(shardId, epoch);

      await this.cachingService.setCacheLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key, blses, CacheInfo.ShardAndEpochBlses(shardId, epoch).ttl);
    }

    proposer = blses[proposer];

    if (validators) {
      validators = validators.map((index: number) => blses[index]);
    }

    return { shardId, epoch, validators, ...rest, proposer };
  }

  async getBlock(hash: string): Promise<BlockDetailed> {
    const result = await this.indexerService.getItem('blocks', 'hash', hash);

    if (result.round > 0) {
      const publicKeys = await this.blsService.getPublicKeys(result.shardId, result.epoch);
      result.proposer = publicKeys[result.proposer];
      result.validators = result.validators.map((validator: number) => publicKeys[validator]);
    } else {
      result.validators = [];
    }

    return BlockDetailed.mergeWithElasticResponse(new BlockDetailed(), result);
  }

  async getCurrentEpoch(): Promise<number> {
    const blocks = await this.getBlocks(new BlockFilter(), new QueryPagination({ from: 0, size: 1 }));
    if (blocks.length === 0) {
      return -1;
    }

    return blocks[0].epoch;
  }
}
