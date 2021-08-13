import { Injectable } from '@nestjs/common';
import { Stats } from 'src/endpoints/network/entities/stats';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { ApiService } from 'src/helpers/api.service';
import { CachingService } from 'src/helpers/caching.service';
import { DataApiService } from 'src/helpers/data.api.service';
import { DataQuoteType } from 'src/helpers/entities/data.quote.type';
import { GatewayService } from 'src/helpers/gateway.service';
import { denominate, denominateString } from 'src/helpers/helpers';
import { Constants } from 'src/utils/constants';
import { AccountService } from '../accounts/account.service';
import { BlockService } from '../blocks/block.service';
import { BlockFilter } from '../blocks/entities/block.filter';
import { NodeStatus } from '../nodes/entities/node.status';
import { NodeService } from '../nodes/node.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { TransactionService } from '../transactions/transaction.service';
import { VmQueryService } from '../vm.query/vm.query.service';
import { NetworkConstants } from './entities/constants';
import { Economics } from './entities/economics';

@Injectable()
export class NetworkService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly blockService: BlockService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly dataApiService: DataApiService,
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService
  ) {}

  async getConstants(): Promise<NetworkConstants> {
    let gatewayUrl = this.apiConfigService.getGatewayUrl();

    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            // erd_denomination: denomination,
            erd_gas_per_data_byte: gasPerDataByte,
            erd_min_gas_limit: minGasLimit,
            erd_min_gas_price: minGasPrice,
            erd_min_transaction_version: minTransactionVersion,
            // erd_round_duration: roundDuration,
          },
        },
      },
    } = await this.apiService.get(`${gatewayUrl}/network/config`);

    return { chainId, gasPerDataByte, minGasLimit, minGasPrice, minTransactionVersion };
  }

  async getEconomics(): Promise<Economics> {
    return this.cachingService.getOrSetCache(
      'economics',
      async () => await this.getEconomicsRaw(),
      Constants.oneMinute() * 10
    );
  }

  private async getEconomicsRaw(): Promise<Economics> {
    const locked = 2660000;
    const [
      { account: { balance } },
      { metrics: { erd_total_supply } },
      [, totalWaitingStakeBase64],
      priceValue,
      marketCapValue,
    ] = await Promise.all([
      this.gatewayService.get(`address/${this.apiConfigService.getAuctionContractAddress()}`),
      this.gatewayService.get('network/economics'),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getTotalStakeByType',
      ),
      this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price),
      this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.marketCap)
    ]);

    const totalWaitingStakeHex = Buffer.from(totalWaitingStakeBase64, 'base64').toString('hex');
    let totalWaitingStake = BigInt(
      totalWaitingStakeHex ? '0x' + totalWaitingStakeHex : totalWaitingStakeHex
    );

    const staked = parseInt((BigInt(balance) + totalWaitingStake).toString().slice(0, -18));
    const totalSupply = parseInt(erd_total_supply.slice(0, -18));

    const circulatingSupply = totalSupply - locked;

    let aprInfo = await this.getApr(denominateString(balance));

    return { 
      totalSupply, 
      circulatingSupply, 
      staked, 
      price: priceValue ? parseFloat(priceValue.toFixed(2)) : undefined, 
      marketCap: marketCapValue ? parseInt(marketCapValue.toFixed(0)) : undefined, 
      aprPercent: (aprInfo.apr * 100).toRounded(2), 
      queued: aprInfo.totalQueued,
      waiting: denominate(totalWaitingStake),
      inflation: aprInfo.inflation,
    };
  }

  async getApr(stake: number): Promise<{ realStaked: number, inflation: number, apr: number; totalQueued: number, totalQueuedNodes: number }> {
    let allNodes = await this.nodeService.getAllNodes();
    let queuedNodes = allNodes.filter(x => x.status === NodeStatus.queued);

    let totalQueued = 0;
    let totalQueuedNodes = 0;

    let groupedQueuedNodesWithOwner = queuedNodes.groupBy(x => x.owner);
    for (let owner of Object.keys(groupedQueuedNodesWithOwner)) {
      let totalLocked = BigInt(0);
      let nodesWithSameOwner = allNodes.filter(x => x.owner === owner);
      for (let node of nodesWithSameOwner) {
        totalLocked += BigInt(node.locked);
      }

      let totalNodes = nodesWithSameOwner.length;
      let queuedNodes = groupedQueuedNodesWithOwner[owner].length;
      totalQueuedNodes += queuedNodes;

      let lockedAmount = denominateString(totalLocked.toString());
      let queueRatio = queuedNodes / totalNodes;
      let queuedAmount = lockedAmount * queueRatio;

      totalQueued += queuedAmount;
    }

    totalQueued = Math.round(totalQueued);
    stake = Math.round(stake);
    let realStaked = stake - totalQueued;

    let networkConfig = await this.gatewayService.get('network/config');
    let roundSeconds = networkConfig.config.erd_round_duration / 1000;
    let roundsPerEpoch = networkConfig.config.erd_rounds_per_epoch;
    let epochSeconds = roundSeconds * roundsPerEpoch;

    let yearSeconds = 3600 * 24 * 365;
    let epochsInYear = yearSeconds / epochSeconds;

    let currentEpoch = await this.blockService.getCurrentEpoch();

    let yearIndex = Math.floor(currentEpoch / epochsInYear);
    let inflationAmounts = this.apiConfigService.getInflationAmounts();

    if (yearIndex >= inflationAmounts.length) {
      throw new Error(`There is no inflation information for year with index ${yearIndex}`);
    }

    let inflation = inflationAmounts[yearIndex];
    let apr = inflation / realStaked;

    return { realStaked, inflation, apr, totalQueued, totalQueuedNodes };
  }

  async getStats(): Promise<Stats> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();
    
    const [
      {
        config: { erd_num_shards_without_meta: shards, erd_round_duration: refreshRate },
      },
      {
        status: {
          erd_epoch_number: epoch,
          erd_rounds_passed_in_current_epoch: roundsPassed,
          erd_rounds_per_epoch: roundsPerEpoch,
        },
      },
      blocks,
      accounts,
      transactions
    ] = await Promise.all([
      this.gatewayService.get('network/config'),
      this.gatewayService.get(`network/status/${metaChainShard}`),
      this.blockService.getBlocksCount(new BlockFilter()),
      this.accountService.getAccountsCount(),
      this.transactionService.getTransactionCount(new TransactionFilter()),
    ]);

    return {
      shards,
      blocks,
      accounts,
      transactions,
      refreshRate,
      epoch,
      roundsPassed,
      roundsPerEpoch,
    }
  }

  async getValidatorStatistics() {
    return await this.gatewayService.get('validator/statistics');
  }
}
