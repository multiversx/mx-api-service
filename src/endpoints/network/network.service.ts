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
import { GatewayService } from 'src/common/gateway/gateway.service';
import { CacheInfo } from 'src/utils/cache.info';
import { BinaryUtils, NumberUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { About } from './entities/about';
import { PluginService } from 'src/common/plugins/plugin.service';
import { SmartContractResultService } from '../sc-results/scresult.service';
import { TokenService } from '../tokens/token.service';
import { AccountQueryOptions } from '../accounts/entities/account.query.options';
import { DataApiService } from 'src/common/data-api/data-api.service';
import { FeatureConfigs } from './entities/feature.configs';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { SmartContractResultFilter } from '../sc-results/entities/smart.contract.result.filter';

@Injectable()
export class NetworkService {
  private readonly logger = new OriginLogger(NetworkService.name);
  constructor(
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly dataApiService: DataApiService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    private readonly pluginService: PluginService,
    @Inject(forwardRef(() => SmartContractResultService))
    private readonly smartContractResultService: SmartContractResultService,
    private readonly indexerService: IndexerService,
  ) { }

  async getConstants(): Promise<NetworkConstants> {
    return await this.cachingService.getOrSet(
      CacheInfo.Constants.key,
      async () => await this.getConstantsRaw(),
      CacheInfo.Constants.ttl
    );
  }

  private async getConstantsRaw(): Promise<NetworkConstants> {
    const networkConfig = await this.gatewayService.getNetworkConfig();

    const chainId = networkConfig.erd_chain_id;
    const gasPerDataByte = networkConfig.erd_gas_per_data_byte;
    const minGasLimit = networkConfig.erd_min_gas_limit;
    const minGasPrice = networkConfig.erd_min_gas_price;
    const minTransactionVersion = networkConfig.erd_min_transaction_version;
    const gasPriceModifier = networkConfig.erd_gas_price_modifier;

    return {
      chainId,
      gasPerDataByte,
      minGasLimit,
      minGasPrice,
      minTransactionVersion,
      gasPriceModifier,
    };
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();
    const [
      {
        erd_round_duration, erd_rounds_per_epoch,
      },
      {
        erd_rounds_passed_in_current_epoch,
      },
    ] = await Promise.all([
      this.gatewayService.getNetworkConfig(),
      this.gatewayService.getNetworkStatus(metaChainShard),
    ]);

    const roundsPassed = erd_rounds_passed_in_current_epoch;
    const roundsPerEpoch = erd_rounds_per_epoch;
    const roundDuration = erd_round_duration / 1000;

    return { roundsPassed, roundsPerEpoch, roundDuration };
  }

  async getEconomics(): Promise<Economics> {
    const economics = await this.cachingService.getOrSet(
      CacheInfo.Economics.key,
      async () => await this.getEconomicsRaw(),
      CacheInfo.Economics.ttl,
    );

    // we do a deep copy here because we don't want to modify the cached object
    return new Economics({ ...economics });
  }

  async getEconomicsRaw(): Promise<Economics> {
    const auctionContractBalance = await this.getAuctionContractBalance();
    const egldPrice = await this.dataApiService.getEgldPrice();
    const tokenMarketCap = await this.tokenService.getTokenMarketCapRaw();

    const currentEpoch = await this.blockService.getCurrentEpoch();

    let totalWaitingStake: BigInt = BigInt(0);
    if (!this.apiConfigService.isStakingV4Enabled() || currentEpoch < this.apiConfigService.getStakingV4ActivationEpoch()) {
      totalWaitingStake = await this.getTotalWaitingStake();
    }

    const staked = NumberUtils.denominate(BigInt(auctionContractBalance.toString()) + BigInt(totalWaitingStake.toString())).toRounded();

    const totalSupply = await this.getTotalSupply();
    const circulatingSupply = totalSupply;

    const price = egldPrice?.toRounded(2);
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

    return economics;
  }

  private async getAuctionContractBalance(): Promise<BigInt> {
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return BigInt(0);
    }

    const addressDetails = await this.gatewayService.getAddressDetails(auctionContractAddress);

    const balance = addressDetails?.account?.balance;
    if (!balance) {
      throw new Error(`Could not fetch balance from auction contract address '${auctionContractAddress}'`);
    }

    return BigInt(balance);
  }

  private async getTotalSupply(): Promise<number> {
    const economics = await this.gatewayService.getNetworkEconomics();

    const totalSupply = economics?.erd_total_supply;
    if (!totalSupply) {
      throw new Error('Could not extract erd_total_supply from network economics');
    }

    return NumberUtils.denominate(BigInt(totalSupply)).toRounded();
  }

  private async getTotalWaitingStake(): Promise<BigInt> {
    const delegationContractAddress = this.apiConfigService.getDelegationContractAddress();
    if (!delegationContractAddress) {
      return BigInt(0);
    }

    const vmQueryResult = await this.vmQueryService.vmQuery(
      delegationContractAddress,
      'getTotalStakeByType',
    );

    if (!vmQueryResult || vmQueryResult.length < 2) {
      throw new Error(`Could not fetch getTotalStakeByType from delegation contract address '${delegationContractAddress}'`);
    }

    const totalWaitingStakeBase64 = vmQueryResult[1];

    return BinaryUtils.base64ToBigInt(totalWaitingStakeBase64);
  }

  async getStats(): Promise<Stats> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();

    const [
      networkConfig,
      networkStatus,
      blocksCount,
      accountsCount,
      transactionsCount,
      scResultsCount,
    ] = await Promise.all([
      this.gatewayService.getNetworkConfig(),
      this.gatewayService.getNetworkStatus(metaChainShard),
      this.blockService.getBlocksCount(new BlockFilter()),
      this.accountService.getAccountsCount(new AccountQueryOptions()),
      this.transactionService.getTransactionCount(new TransactionFilter()),
      this.smartContractResultService.getScResultsCount(new SmartContractResultFilter()),
    ]);

    const { erd_num_shards_without_meta: shards, erd_round_duration: refreshRate } = networkConfig;
    const { erd_epoch_number: epoch, erd_rounds_passed_in_current_epoch: roundsPassed, erd_rounds_per_epoch: roundsPerEpoch } = networkStatus;

    return {
      shards,
      blocks: blocksCount,
      accounts: accountsCount,
      transactions: transactionsCount + scResultsCount,
      scResults: scResultsCount,
      refreshRate,
      epoch,
      roundsPassed: roundsPassed % roundsPerEpoch,
      roundsPerEpoch,
    };
  }

  async getApr(): Promise<{ apr: number; topUpApr: number; baseApr: number }> {
    const stats = await this.getStats();
    const config = await this.getNetworkConfig();
    const stake = await this.stakeService.getValidators();
    if (!stake) {
      throw new Error('Global stake not available');
    }

    const stakedBalance = await this.getAuctionContractBalance();

    const multiversxConfig = {
      feesInEpoch: 0,
      stakePerNode: 2500,
    };

    const feesInEpoch = multiversxConfig.feesInEpoch;
    const stakePerNode = multiversxConfig.stakePerNode;
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

    const networkBaseStake = stake.totalValidators * stakePerNode;
    const networkTotalStake = NumberUtils.denominateString(stakedBalance.toString()) - ((stake.inactiveValidators ?? 0) * stakePerNode);

    const networkTopUpStake = networkTotalStake - networkBaseStake;

    const topUpReward = ((2 * topUpRewardsLimit) / Math.PI) * Math.atan(networkTopUpStake / (2 * 2000000));
    const baseReward = rewardsPerEpoch - topUpReward;

    const apr = (epochsInYear * (topUpReward + baseReward)) / networkTotalStake;

    const topUpApr = (epochsInYear * topUpReward) / networkTopUpStake;
    const baseApr = (epochsInYear * baseReward) / networkBaseStake;

    return { apr, topUpApr, baseApr };
  }

  async getAbout(): Promise<About> {
    return await this.cachingService.getOrSet(
      CacheInfo.About.key,
      async () => await this.getAboutRaw(),
      CacheInfo.About.ttl,
    );
  }

  async getAboutRaw(): Promise<About> {
    let appVersion: string | undefined = undefined;
    let pluginsVersion: string | undefined = undefined;

    let apiVersion = process.env['API_VERSION'];
    if (!apiVersion) {
      apiVersion = this.tryGetCurrentTag();

      if (!apiVersion) {
        apiVersion = this.tryGetPreviousTag();

        if (apiVersion) {
          apiVersion = apiVersion + '-next';
        }
      }

      appVersion = this.tryGetAppCommitHash();
      pluginsVersion = this.tryGetPluginsCommitHash();
    }

    if (pluginsVersion === appVersion) {
      pluginsVersion = undefined;
    }

    const features = new FeatureConfigs({
      updateCollectionExtraDetails: this.apiConfigService.isUpdateCollectionExtraDetailsEnabled(),
      marketplace: this.apiConfigService.isMarketplaceFeatureEnabled(),
      exchange: this.apiConfigService.isExchangeEnabled(),
      dataApi: this.apiConfigService.isDataApiFeatureEnabled(),
    });

    let indexerVersion: string | undefined;
    let gatewayVersion: string | undefined;

    try {
      indexerVersion = await this.indexerService.getVersion();
    } catch (error) {
      this.logger.error('Failed to fetch indexer version', error);
    }

    try {
      gatewayVersion = await this.gatewayService.getVersion();
    } catch (error) {
      this.logger.error('Failed to fetch gateway version', error);
    }

    const about = new About({
      appVersion,
      pluginsVersion,
      network: this.apiConfigService.getNetwork(),
      cluster: this.apiConfigService.getCluster(),
      version: apiVersion,
      indexerVersion: indexerVersion,
      gatewayVersion: gatewayVersion,
      features: features,
    });

    await this.pluginService.processAbout(about);

    return about;
  }

  numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  }

  private tryGetCurrentTag(): string | undefined {
    try {
      return require('child_process')
        .execSync('git tag --points-at HEAD')
        .toString().trim();
    } catch (error) {
      this.logger.error('An unhandled error occurred when fetching current tag');
      this.logger.error(error);
      return undefined;
    }
  }

  private tryGetPreviousTag(): string | undefined {
    try {
      return require('child_process')
        .execSync('git describe --tags --abbrev=0')
        .toString().trim();
    } catch (error) {
      this.logger.error('An unhandled error occurred when fetching previous tag');
      this.logger.error(error);
      return undefined;
    }
  }

  private tryGetAppCommitHash(): string | undefined {
    try {
      return require('child_process')
        .execSync('git rev-parse HEAD')
        .toString().trim();
    } catch (error) {
      this.logger.error('An unhandled error occurred when fetching app commit hash');
      this.logger.error(error);
      return undefined;
    }
  }

  private tryGetPluginsCommitHash(): string | undefined {
    try {
      return require('child_process')
        .execSync('git rev-parse HEAD', { cwd: 'src/plugins' })
        .toString().trim();
    } catch (error) {
      this.logger.error('An unhandled error occurred when fetching plugins commit hash');
      this.logger.error(error);
      return undefined;
    }
  }
}
