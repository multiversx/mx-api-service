import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Stats } from 'src/endpoints/network/entities/stats';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
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
import { DataQuoteType } from 'src/common/external/entities/data.quote.type';
import { CacheInfo } from 'src/utils/cache.info';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';
import { Constants, NumberUtils, CachingService, ApiService } from '@elrondnetwork/erdnest';
import { About } from './entities/about';
import { EsdtService } from '../esdt/esdt.service';

@Injectable()
export class NetworkService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly dataApiService: DataApiService,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => EsdtService))
    private readonly esdtService: EsdtService,
  ) { }

  async getConstants(): Promise<NetworkConstants> {
    return await this.cachingService.getOrSetCache(
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
    return await this.cachingService.getOrSetCache(
      CacheInfo.Economics.key,
      async () => await this.getEconomicsRaw(),
      CacheInfo.Economics.ttl,
    );
  }

  async getMinimumAuctionTopUp(): Promise<string | undefined> {
    const auctions = await this.gatewayService.getAuctions();

    if (auctions.length === 0) {
      return undefined;
    }

    let minimumAuctionTopUp: string | undefined = undefined;

    for (const auction of auctions) {
      for (const auctionNode of auction.auctionList) {
        if (auctionNode.selected === true && (!minimumAuctionTopUp || BigInt(minimumAuctionTopUp) > BigInt(auction.qualifiedTopUp))) {
          minimumAuctionTopUp = auction.qualifiedTopUp;
        }
      }
    }

    return minimumAuctionTopUp;
  }

  async getEconomicsRaw(): Promise<Economics> {
    const locked = 1330000;
    const [
      {
        account: { balance },
      },
      {
        metrics: { erd_total_supply },
      },
      [, totalWaitingStakeBase64],
      priceValue,
      tokenMarketCap,
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
      this.esdtService.getTokenMarketCapRaw(),
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
    const price = priceValue ? parseFloat(priceValue.toFixed(2)) : undefined;
    const marketCap = price ? Math.round(price * circulatingSupply) : undefined;

    const aprInfo = await this.getApr();

    const economics = new Economics({
      totalSupply,
      circulatingSupply,
      staked,
      price,
      marketCap,
      apr: aprInfo.apr ? aprInfo.apr.toRounded(6) : 0,
      topUpApr: aprInfo.topUpApr ? aprInfo.topUpApr.toRounded(6) : 0,
      baseApr: aprInfo.baseApr ? aprInfo.baseApr.toRounded(6) : 0,
      tokenMarketCap: tokenMarketCap ? Math.round(tokenMarketCap) : undefined,
    });

    if (this.apiConfigService.isStakingV4Enabled()) {
      economics.minimumAuctionTopUp = await this.getMinimumAuctionTopUp();
    }

    return economics;
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
    };

    const feesInEpoch = elrondConfig.feesInEpoch;
    const stakePerNode = elrondConfig.stakePerNode;
    const epochDuration = config.roundDuration * config.roundsPerEpoch;
    const secondsInYear = 365 * 24 * 3600;
    const epochsInYear = secondsInYear / epochDuration;

    const yearIndex = Math.floor(stats.epoch / epochsInYear);

    const inflationAmounts = this.apiConfigService.getInflationAmounts();

    if (yearIndex >= inflationAmounts.length) {
      throw new Error(`There is no inflation information for year with index ${yearIndex}`,);
    }

    const inflation = inflationAmounts[yearIndex];
    const rewardsPerEpoch = Math.max(inflation / epochsInYear, feesInEpoch);

    const topUpRewardsLimit = 0.5 * rewardsPerEpoch;
    const networkBaseStake = stake.activeValidators * stakePerNode;
    const networkTotalStake = NumberUtils.denominateString(stakedBalance) - (stake.queueSize * stakePerNode);

    const networkTopUpStake = networkTotalStake - networkBaseStake;

    const topUpReward = ((2 * topUpRewardsLimit) / Math.PI) * Math.atan(networkTopUpStake / (2 * 2000000));
    const baseReward = rewardsPerEpoch - topUpReward;

    const apr = (epochsInYear * (topUpReward + baseReward)) / networkTotalStake;

    const topUpApr = (epochsInYear * topUpReward) / networkTopUpStake;
    const baseApr = (epochsInYear * baseReward) / networkBaseStake;

    return { apr, topUpApr, baseApr };
  }

  async getAbout(): Promise<About> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.About.key,
      async () => await this.getAboutRaw(),
      CacheInfo.About.ttl,
    );
  }

  getAboutRaw(): About {
    const appVersion = require('child_process')
      .execSync('git rev-parse --short HEAD')
      .toString().trim();

    let pluginsVersion = require('child_process')
      .execSync('git rev-parse --short HEAD', { cwd: 'src/plugins' })
      .toString().trim();

    let apiVersion = require('child_process')
      .execSync('git tag --points-at HEAD')
      .toString().trim();

    if (pluginsVersion === appVersion) {
      pluginsVersion = undefined;
    }

    if (!apiVersion) {
      apiVersion = require('child_process')
        .execSync('git describe --tags --abbrev=0')
        .toString().trim();

      if (apiVersion) {
        apiVersion = apiVersion + '-next';
      }
    }

    return new About({
      appVersion,
      pluginsVersion,
      network: this.apiConfigService.getNetwork(),
      cluster: this.apiConfigService.getCluster(),
      version: apiVersion,
    });
  }

  numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  }
}
