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
import { ConcurrencyUtils } from "src/utils/concurrency.utils";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { GatewayService } from "../../common/gateway/gateway.service";

@Injectable()
export class BlockService {
  private readonly logger = new OriginLogger(BlockService.name);
  constructor(
    private readonly indexerService: IndexerService,
    private readonly cachingService: CacheService,
    private readonly blsService: BlsService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService,
    @Inject(forwardRef(() => IdentitiesService))
    private readonly identitiesService: IdentitiesService,
    private readonly apiConfigService: ApiConfigService,
    private readonly gatewayService: GatewayService,
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

    const executionResultsMap = await this.fetchExecutionResultsForBlocks(result as any[]);
    if (executionResultsMap.size > 0) {
      for (const item of result as any[]) {
        const executionResult = executionResultsMap.get(item.hash);
        if (executionResult) {
          ApiUtils.mergeObjects(item, executionResult);
        }
      }
    }

    const blocks = await Promise.all(result.map(async (item) => {
      const blockRaw = await this.computeProposerAndValidators(item);

      const block = Block.mergeWithElasticResponse(new Block(), blockRaw);

      if (blockRaw.scheduledData && blockRaw.scheduledData.rootHash) {
        block.scheduledRootHash = blockRaw.scheduledData.rootHash;
      }

      return block;
    }));

    if (withProposerIdentity === true) {
      await this.applyProposerIdentity(blocks);
    }

    return blocks;
  }

  private async fetchExecutionResultsForBlocks(items: any[]): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    if (!items || items.length === 0) {
      this.logger.log(`fetchExecutionResultsForBlocks: no items provided`);
      return map;
    }

    const supernovaEnableEpoch = await this.getSupernovaEnableEpoch();
    if (supernovaEnableEpoch === -1) {
      this.logger.log(`fetchExecutionResultsForBlocks: Supernova disabled (enable epoch = -1)`);
      return map;
    }

    const eligible = items.filter((r: any) => (r?.epoch ?? -1) >= supernovaEnableEpoch);
    const allEpochs = items.map((r: any) => r?.epoch ?? -1);
    const minEpoch = Math.min(...allEpochs);
    const maxEpoch = Math.max(...allEpochs);
    this.logger.log(`fetchExecutionResultsForBlocks: Supernova enable epoch=${supernovaEnableEpoch}, items=${items.length}, eligible=${eligible.length}, epochs[min=${minEpoch}, max=${maxEpoch}]`);
    if (eligible.length === 0) {
      return map;
    }

    const hashes = eligible.map((r: any) => r.hash).filter(Boolean);
    if (hashes.length === 0) {
      this.logger.log(`fetchExecutionResultsForBlocks: no eligible hashes found`);
      return map;
    }

    try {
      const sample = hashes.slice(0, 3);
      this.logger.log(`fetchExecutionResultsForBlocks: querying executionresults for ${hashes.length} hashes (sample=${sample.join(',')}${hashes.length > sample.length ? ', ...' : ''})`);
      const executionResults = await this.indexerService.getExecutionResultsForHashes(hashes);
      this.logger.log(`fetchExecutionResultsForBlocks: received ${executionResults?.length ?? 0} executionresults`);
      for (const er of executionResults as any[]) {
        if (er?.hash) {
          map.set(er.hash, er);
        }
      }
    } catch {
      this.logger.error(`fetchExecutionResultsForBlocks: error while fetching executionresults for ${hashes.length} hashes`);
      return map;
    }

    return map;
  }

  private async applyProposerIdentity(blocks: Block[]): Promise<void> {
    const proposerBlses = blocks.map(x => x.proposer);

    const nodes = await this.nodeService.getAllNodes();
    const relevantNodes = nodes.filter(node => proposerBlses.includes(node.bls) && node.identity);

    const nodeIdentities = await ConcurrencyUtils.executeWithConcurrencyLimit(
      relevantNodes,
      async (node) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const identity = await this.identitiesService.getIdentity(node.identity!);
        return { node, identity };
      },
      25,
      'Block proposer identities'
    );
    for (const { node, identity } of nodeIdentities) {
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
    const { shardId, epoch, searchOrder, proposerBlsKey, ...rest } = item;
    let { proposer, validators } = item;

    let blses: any = await this.cachingService.getLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key);
    if (!blses) {
      blses = await this.blsService.getPublicKeys(shardId, epoch);

      this.cachingService.setLocal(CacheInfo.ShardAndEpochBlses(shardId, epoch).key, blses, CacheInfo.ShardAndEpochBlses(shardId, epoch).ttl);
    }

    if (proposerBlsKey) {
      proposer = proposerBlsKey;
    } else {
      proposer = blses[proposer];
    }

    if (validators) {
      validators = validators.map((index: number) => blses[index]);
    }

    return { shardId, epoch, validators, ...rest, proposer };
  }

  async getBlock(hash: string): Promise<BlockDetailed> {
    let result = await this.indexerService.getBlock(hash) as any;

    const isChainAndromedaEnabled = this.apiConfigService.isChainAndromedaEnabled()
      && result.epoch >= this.apiConfigService.getChainAndromedaActivationEpoch();

    const supernovaEnableEpoch = await this.getSupernovaEnableEpoch();
    const isSupernovaEnabled = supernovaEnableEpoch !== -1 && result.epoch >= supernovaEnableEpoch;
    this.logger.log(`getBlock: hash=${hash}, epoch=${result?.epoch}, supernovaEnableEpoch=${supernovaEnableEpoch}, isSupernovaEnabled=${isSupernovaEnabled}`);
    if (isSupernovaEnabled) {
      const executionResults = await this.indexerService.getExecutionResults(hash);
      this.logger.log(`getBlock: executionresults ${executionResults ? 'found' : 'not found'} for hash=${hash}`);
      if (executionResults) {
        result = ApiUtils.mergeObjects(result, executionResults);
      }
    }

    if (result.round > 0) {
      const publicKeys = await this.blsService.getPublicKeys(result.shardId, result.epoch);
      if (result.proposerBlsKey) {
        result.proposer = result.proposerBlsKey;
      } else {
        result.proposer = publicKeys[result.proposer];
      }
      if (!isChainAndromedaEnabled) {
        result.validators = result.validators?.map((validator: number) => publicKeys[validator]);
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

  async getSupernovaEnableEpoch(): Promise<number> {
    const enableEpochs = await this.getNetworkEnableEpochs();
    return enableEpochs?.["erd_supernova_enable_epoch"] ?? -1;
  }

  async getNetworkEnableEpochs(): Promise<Record<string, number>> {
    return await this.cachingService.getOrSet(
      CacheInfo.NetworkEnableEpochs.key,
      async () => await this.gatewayService.getNetworkEnableEpochs(),
      CacheInfo.NetworkEnableEpochs.ttl,
    );
  }
}
