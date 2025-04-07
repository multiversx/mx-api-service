import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Block } from "./entities/block";
import { BlockDetailed } from "./entities/block.detailed";
import { BlockFilter } from "./entities/block.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlsService } from "src/endpoints/bls/bls.service";
import { CacheInfo } from "src/utils/cache.info";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { IndexerService } from "src/common/indexer/indexer.service";
import { NodeService } from "../nodes/node.service";
import { IdentitiesService } from "../identities/identities.service";
import { ApiConfigService } from "../../common/api-config/api.config.service";

@Injectable()
export class BlockService {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly cachingService: CacheService,
    private readonly blsService: BlsService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => IdentitiesService))
    private readonly identitiesService: IdentitiesService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.cachingService.getOrSet(
      CacheInfo.BlocksCount(filter).key,
      async () => await this.indexerService.getBlocksCount(filter),
      CacheInfo.BlocksCount(filter).ttl,
    );
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination, withProposerIdentity?: boolean): Promise<Block[]> {
    const result = await this.indexerService.getBlocks(filter, queryPagination);
    const blocks = [];
    for (const item of result) {
      const blockRaw = await this.computeProposerAndValidators(item);

      const block = Block.mergeWithElasticResponse(new Block(), blockRaw);

      if (blockRaw.scheduledData && blockRaw.scheduledData.rootHash) {
        block.scheduledRootHash = blockRaw.scheduledData.rootHash;
      }

      blocks.push(block);
    }

    if (withProposerIdentity === true) {
      await this.applyProposerIdentity(blocks);
    }

    return blocks;
  }

  private async applyProposerIdentity(blocks: Block[]): Promise<void> {
    const proposerBlses = blocks.map(x => x.proposer);

    const nodes = await this.nodeService.getAllNodes();
    for (const node of nodes) {
      if (!proposerBlses.includes(node.bls)) {
        continue;
      }

      const nodeIdentity = node.identity;
      if (!nodeIdentity) {
        continue;
      }

      const identity = await this.identitiesService.getIdentity(nodeIdentity);
      if (!identity) {
        continue;
      }

      for (const block of blocks) {
        if (block.proposer === node.bls) {
          block.proposerIdentity = identity;
        }
      }
    }
  }

  async computeProposerAndValidators(item: any) {
    const { shardId, epoch, searchOrder, ...rest } = item;
    let { proposer, validators } = item;

    let blses: any = await this.cachingService.getLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key);
    if (!blses) {
      blses = await this.blsService.getPublicKeys(shardId, epoch);

      this.cachingService.setLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key, blses, CacheInfo.ShardAndEpochBlses(shardId, epoch).ttl);
    }

    proposer = blses[proposer];

    if (validators) {
      validators = validators.map((index: number) => blses[index]);
    }

    return {shardId, epoch, validators, ...rest, proposer};
  }

  async getBlock(hash: string): Promise<BlockDetailed> {
    const result = await this.indexerService.getBlock(hash) as any;

    const isChainAndromedaEnabled = this.apiConfigService.isChainAndromedaEnabled()
      && result.epoch >= this.apiConfigService.getChainAndromedaActivationEpoch();

    if (result.round > 0) {
      const publicKeys = await this.blsService.getPublicKeys(result.shardId, result.epoch);
      result.proposer = publicKeys[result.proposer];
      if (!isChainAndromedaEnabled) {
        result.validators = result.validators.map((validator: number) => publicKeys[validator]);
      } else {
        result.validators = publicKeys;
      }
    } else {
      result.validators = [];
    }

    const block = BlockDetailed.mergeWithElasticResponse(new BlockDetailed(), result);
    await this.applyProposerIdentity([block]);

    return block;
  }

  async getCurrentEpoch(): Promise<number> {
    const blocks = await this.getBlocks(new BlockFilter(), new QueryPagination({ from: 0, size: 1 }));
    if (blocks.length === 0) {
      return -1;
    }

    return blocks[0].epoch;
  }

  async getLatestBlock(ttl?: number): Promise<Block | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.BlocksLatest(ttl).key,
      async () => await this.getLatestBlockRaw(),
      CacheInfo.BlocksLatest(ttl).ttl,
      Math.round(CacheInfo.BlocksLatest(ttl).ttl / 10),
    );
  }

  async getLatestBlockRaw(): Promise<Block | undefined> {
    const blocks = await this.getBlocks(new BlockFilter(), new QueryPagination({ from: 0, size: 1 }));
    if (blocks.length === 0) {
      return undefined;
    }
    return blocks[0];
  }
}
