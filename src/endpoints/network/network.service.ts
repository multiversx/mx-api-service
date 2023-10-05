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
import { BinaryUtils, NumberUtils } from '@multiversx/sdk-nestjs-common';
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { About } from './entities/about';
import { PluginService } from 'src/common/plugins/plugin.service';
import { SmartContractResultService } from '../sc-results/scresult.service';
import { TokenService } from '../tokens/token.service';
import { AccountFilter } from '../accounts/entities/account.filter';
import { DataApiService } from 'src/common/data-api/data-api.service';

@Injectable()
export class NetworkService {
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
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    private readonly pluginService: PluginService,
    private readonly smartContractResultService: SmartContractResultService
  ) { }

  async getConstants(): Promise<NetworkConstants> {
    return await this.cachingService.getOrSet(
      CacheInfo.Constants.key,
      async () => await this.getConstantsRaw(),
      CacheInfo.Constants.ttl
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

  async getMinimumAuctionTopUp(): Promise<string | undefined> {
    const auctions = await this.gatewayService.getValidatorAuctions();

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
    const auctionContractBalance = await this.getAuctionContractBalance();
    const totalWaitingStake = await this.getTotalWaitingStake();
    const egldPrice = await this.dataApiService.getEgldPrice();
    const tokenMarketCap = await this.tokenService.getTokenMarketCapRaw();

    const staked = NumberUtils.denominate(BigInt(auctionContractBalance.toString()) + BigInt(totalWaitingStake.toString())).toRounded();

    const totalSupply = await this.getTotalSupply();
    const locked = await this.getLockedSupply();
    const circulatingSupply = totalSupply - locked;

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

    if (this.apiConfigService.isStakingV4Enabled()) {
      economics.minimumAuctionTopUp = await this.getMinimumAuctionTopUp();
    }

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

  private async getLockedSupply(): Promise<number> {
    let locked: number = 0;
    if (this.apiConfigService.getNetwork() === 'mainnet') {
      const account = await this.accountService.getAccountRaw('erd195fe57d7fm5h33585sc7wl8trqhrmy85z3dg6f6mqd0724ymljxq3zjemc');
      if (account) {
        locked = NumberUtils.denominate(BigInt(account.balance)).toRounded();
      }
    }

    return locked;
  }

  async getStats(): Promise<Stats> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();

    const [
      {
        erd_num_shards_without_meta: shards,
        erd_round_duration: refreshRate,
      },
      {
        erd_epoch_number: epoch,
        erd_rounds_passed_in_current_epoch: roundsPassed,
        erd_rounds_per_epoch: roundsPerEpoch,
      },
      blocks,
      accounts,
      transactions,
      scResults,
    ] = await Promise.all([
      this.gatewayService.getNetworkConfig(),
      this.gatewayService.getNetworkStatus(metaChainShard),
      this.blockService.getBlocksCount(new BlockFilter()),
      this.accountService.getAccountsCount(new AccountFilter()),
      this.transactionService.getTransactionCount(new TransactionFilter()),
      this.smartContractResultService.getScResultsCount(),
    ]);

    return {
      shards,
      blocks,
      accounts,
      transactions: transactions + scResults,
      scResults,
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
    const stakedBalance = await this.getAuctionContractBalance();

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
    const networkTotalStake = NumberUtils.denominateString(stakedBalance.toString()) - (stake.queueSize * stakePerNode);

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
    const appVersion = require('child_process')
      .execSync('git rev-parse HEAD')
      .toString().trim();

    let pluginsVersion = require('child_process')
      .execSync('git rev-parse HEAD', { cwd: 'src/plugins' })
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

    const about = new About({
      appVersion,
      pluginsVersion,
      network: this.apiConfigService.getNetwork(),
      cluster: this.apiConfigService.getCluster(),
      version: apiVersion,
    });

    await this.pluginService.processAbout(about);

    return about;
  }

  numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  }
}
