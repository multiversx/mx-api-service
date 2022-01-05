import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Stats } from 'src/endpoints/network/entities/stats';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CachingService } from 'src/common/caching/caching.service';
import { Constants } from 'src/utils/constants';
import { NumberUtils } from 'src/utils/number.utils';
import { AccountService } from '../accounts/account.service';
import { BlockService } from '../blocks/block.service';
import { BlockFilter } from '../blocks/entities/block.filter';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { TransactionService } from '../transactions/transaction.service';
import { VmQueryService } from '../vm.query/vm.query.service';
import { NetworkConstants } from './entities/constants';
import { Economics } from './entities/economics';
import { NetworkConfig } from './entities/network.config';
import { StakeService } from '../stake/stake.service';
import { DataApiService } from 'src/common/external/data.api.service';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { ApiService } from 'src/common/network/api.service';
import { DataQuoteType } from 'src/common/external/entities/data.quote.type';
import { CacheInfo } from 'src/common/caching/entities/cache.info';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';
import { NodeService } from '../nodes/node.service';
import { NodeFilter } from '../nodes/entities/node.filter';

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
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => NodeService))
    private readonly nodeService: NodeService
  ) { }

  async getConstants(): Promise<NetworkConstants> {
    return this.cachingService.getOrSetCache(
      'constants',
      async () => await this.getConstantsRaw(),
      Constants.oneDay()
    );
  }

  private async getConstantsRaw(): Promise<NetworkConstants> {
    const gatewayUrl = this.apiConfigService.getGatewayUrl();

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

    return {
      chainId,
      gasPerDataByte,
      minGasLimit,
      minGasPrice,
      minTransactionVersion,
    };
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const [
      {
        config: { erd_round_duration, erd_rounds_per_epoch },
      },
      {
        status: { erd_rounds_passed_in_current_epoch },
      },
    ] = await Promise.all([
      this.gatewayService.get('network/config', GatewayComponentRequest.networkConfig),
      this.gatewayService.get('network/status/4294967295', GatewayComponentRequest.networkStatus),
    ]);

    const roundsPassed = erd_rounds_passed_in_current_epoch;
    const roundsPerEpoch = erd_rounds_per_epoch;
    const roundDuration = erd_round_duration / 1000;

    return { roundsPassed, roundsPerEpoch, roundDuration };
  }

  async getEconomics(): Promise<Economics> {
    return this.cachingService.getOrSetCache(
      CacheInfo.Economics.key,
      async () => await this.getEconomicsRaw(),
      CacheInfo.Economics.ttl,
    );
  }

  async getEconomicsRaw(): Promise<Economics> {
    const locked = 2660000;
    const [
      {
        account: { balance },
      },
      {
        metrics: { erd_total_supply },
      },
      [, totalWaitingStakeBase64],
      priceValue,
      marketCapValue,
    ] = await Promise.all([
      this.gatewayService.get(
        `address/${this.apiConfigService.getAuctionContractAddress()}`,
        GatewayComponentRequest.addressDetails
      ),
      this.gatewayService.get('network/economics', GatewayComponentRequest.networkEconomics),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getTotalStakeByType',
      ),
      this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price),
      this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.marketCap),
    ]);

    const totalWaitingStakeHex = Buffer.from(
      totalWaitingStakeBase64,
      'base64',
    ).toString('hex');
    const totalWaitingStake = BigInt(
      totalWaitingStakeHex ? '0x' + totalWaitingStakeHex : totalWaitingStakeHex,
    );

    const staked = parseInt((BigInt(balance) + totalWaitingStake).toString().slice(0, -18));
    const totalSupply = parseInt(erd_total_supply.slice(0, -18));

    const circulatingSupply = totalSupply - locked;

    const aprInfo = await this.getApr();

    return {
      totalSupply,
      circulatingSupply,
      staked,
      price: priceValue ? parseFloat(priceValue.toFixed(2)) : undefined,
      marketCap: marketCapValue
        ? parseInt(marketCapValue.toFixed(0))
        : undefined,
      apr: aprInfo.apr ? aprInfo.apr.toRounded(6) : 0,
      topUpApr: aprInfo.topUpApr ? aprInfo.topUpApr.toRounded(6) : 0,
      baseApr: aprInfo.baseApr ? aprInfo.baseApr.toRounded(6) : 0,
    };
  }

  async getStats(): Promise<Stats> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();

    const [
      {
        config: {
          erd_num_shards_without_meta: shards,
          erd_round_duration: refreshRate,
        },
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
      transactions,
    ] = await Promise.all([
      this.gatewayService.get('network/config', GatewayComponentRequest.networkConfig),
      this.gatewayService.get(`network/status/${metaChainShard}`, GatewayComponentRequest.networkStatus),
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
      roundsPassed: roundsPassed % roundsPerEpoch,
      roundsPerEpoch,
    };
  }

  async getApr(): Promise<{ apr: number; topUpApr: number; baseApr: number }> {
    const stats = await this.getStats();
    const config = await this.getNetworkConfig();
    const stake = await this.stakeService.getGlobalStake();
    const {
      account: { balance: stakedBalance },
    } = await this.gatewayService.get(
      `address/${this.apiConfigService.getAuctionContractAddress()}`,
      GatewayComponentRequest.addressDetails
    );
    let [activeStake] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getDelegationContractAddress(),
      'getTotalActiveStake',
    );
    activeStake = this.numberDecode(activeStake);

    const elrondConfig = {
      feesInEpoch: 0,
      stakePerNode: 2500,
      protocolSustainabilityRewards: 0.1,
    };

    const feesInEpoch = elrondConfig.feesInEpoch;
    const stakePerNode = elrondConfig.stakePerNode;
    const protocolSustainabilityRewards =
      elrondConfig.protocolSustainabilityRewards;
    const epochDuration = (config.roundDuration / 1000) * config.roundsPerEpoch;
    const secondsInYear = 365 * 24 * 3600;
    const epochsInYear = secondsInYear / epochDuration;

    const yearIndex = Math.floor(stats.epoch / epochsInYear);
    const inflationAmounts = this.apiConfigService.getInflationAmounts();

    if (yearIndex >= inflationAmounts.length) {
      throw new Error(
        `There is no inflation information for year with index ${yearIndex}`,
      );
    }

    const inflation = inflationAmounts[yearIndex];
    const rewardsPerEpoch = Math.max(inflation / epochsInYear, feesInEpoch);

    const rewardsPerEpochWithoutProtocolSustainability =
      (1 - protocolSustainabilityRewards) * rewardsPerEpoch;
    const topUpRewardsLimit =
      0.5 * rewardsPerEpochWithoutProtocolSustainability;
    const networkBaseStake = stake.activeValidators * stakePerNode;
    const networkTotalStake = NumberUtils.denominateString(stakedBalance);

    const networkTopUpStake =
      networkTotalStake -
      stake.totalValidators * stakePerNode -
      stake.queueSize * stakePerNode;

    const topUpReward =
      ((2 * topUpRewardsLimit) / Math.PI) *
      Math.atan(networkTopUpStake / (2 * 2000000));
    const baseReward =
      rewardsPerEpochWithoutProtocolSustainability - topUpReward;

    const apr = await this.computeAprOfElrondcomNodes(activeStake, stakePerNode, networkTopUpStake, topUpReward, networkBaseStake, baseReward, protocolSustainabilityRewards, epochsInYear);
    const topUpApr = (epochsInYear * topUpReward) / networkTopUpStake;
    const baseApr = (epochsInYear * baseReward) / networkBaseStake;

    return { apr, topUpApr, baseApr };
  }

  private async computeAprOfElrondcomNodes(activeStake: string, stakePerNode: number, networkTopUpStake: number, topUpReward: number, networkBaseStake: number, baseReward: number, protocolSustainabilityRewards: number, epochsInYear: number): Promise<number> {
    const filter = new NodeFilter();
    filter.identity = 'elrondcom';
    const elrondcomNodes = await this.nodeService.getNodes({ from: 0, size: 10000 }, filter);
    const allNodes = elrondcomNodes.filter((node: any) => node.status === 'eligible' || node.status === 'jailed' || node.status === 'queued')
      .length;

    const allActiveNodes = elrondcomNodes.filter((node: any) => node.status === 'eligible').length;

    // based on validator total stake recalibrate the active nodes.
    // it can happen that an user can unStake some tokens, but the node is still active until the epoch change
    const validatorTotalStake = NumberUtils.denominateString(activeStake);
    const actualNumberOfNodes = Math.min(Math.floor(validatorTotalStake / stakePerNode), allActiveNodes);
    const validatorBaseStake = actualNumberOfNodes * stakePerNode;
    const validatorTopUpStake = ((validatorTotalStake - allNodes * stakePerNode) / allNodes) * allActiveNodes;
    const validatorTopUpReward =
      networkTopUpStake > 0 ? (validatorTopUpStake / networkTopUpStake) * topUpReward : 0;
    const validatorBaseReward = (validatorBaseStake / networkBaseStake) * baseReward;
    const anualPercentageRate =
      (epochsInYear * (validatorTopUpReward + validatorBaseReward)) / validatorTotalStake;

    const apr = (anualPercentageRate * (1 - protocolSustainabilityRewards / 100 / 100) * 100);

    return apr;
  }

  numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  }
}
