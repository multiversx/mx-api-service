import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { Constants } from "src/utils/constants";
import { Locker } from "src/utils/locker";
import { CachingService } from "src/common/caching/caching.service";
import { ClientProxy } from "@nestjs/microservices";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NetworkService } from "src/endpoints/network/network.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { CronJob } from "cron";
import { KeybaseService } from "src/common/keybase/keybase.service";
import { DataApiService } from "src/common/external/data.api.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { DataQuoteType } from "src/common/external/entities/data.quote.type";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { TokenAssetService } from "src/endpoints/tokens/token.asset.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { ElasticService } from "src/common/elastic/elastic.service";
import * as JsonDiff from "json-diff";
import { MexSettingsService } from "src/endpoints/mex/mex.settings.service";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
@Injectable()
export class CacheWarmerService {
  private readonly logger: Logger;

  constructor(
    private readonly nodeService: NodeService,
    private readonly esdtService: EsdtService,
    private readonly identitiesService: IdentitiesService,
    private readonly providerService: ProviderService,
    private readonly keybaseService: KeybaseService,
    private readonly dataApiService: DataApiService,
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly apiConfigService: ApiConfigService,
    private readonly networkService: NetworkService,
    private readonly accountService: AccountService,
    private readonly gatewayService: GatewayService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly tokenAssetService: TokenAssetService,
    private readonly elasticService: ElasticService,
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexPairsService: MexPairService,
    private readonly mexTokensService: MexTokenService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexFarmsService: MexFarmService,
  ) {
    this.logger = new Logger(CacheWarmerService.name);

    this.configCronJob(
      'handleKeybaseAgainstKeybasePubInvalidations',
      CronExpression.EVERY_MINUTE,
      CronExpression.EVERY_30_MINUTES,
      async () => await this.handleKeybaseAgainstKeybasePubInvalidations()
    );

    this.configCronJob(
      'handleKeybaseAgainstCacheInvalidations',
      CronExpression.EVERY_MINUTE,
      CronExpression.EVERY_10_MINUTES,
      async () => await this.handleKeybaseAgainstCacheInvalidations()
    );

    this.configCronJob(
      'handleIdentityInvalidations',
      CronExpression.EVERY_MINUTE,
      CronExpression.EVERY_5_MINUTES,
      async () => await this.handleIdentityInvalidations()
    );
  }

  private configCronJob(name: string, fastExpression: string, normalExpression: string, callback: () => Promise<void>) {
    const cronTime = this.apiConfigService.getIsFastWarmerCronActive() ? fastExpression : normalExpression;
    const cronJob = new CronJob(cronTime, async () => await callback());
    this.schedulerRegistry.addCronJob(name, cronJob);
    cronJob.start();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNodeInvalidations() {
    await Locker.lock('Nodes invalidations', async () => {
      const nodes = await this.nodeService.getAllNodesRaw();
      await this.invalidateKey(CacheInfo.Nodes.key, nodes, CacheInfo.Nodes.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEsdtTokenInvalidations() {
    await Locker.lock('Esdt tokens invalidations', async () => {
      const tokens = await this.esdtService.getAllEsdtTokensRaw();
      await this.invalidateKey(CacheInfo.AllEsdtTokens.key, tokens, CacheInfo.AllEsdtTokens.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleTokenAssetsExtraInfoInvalidations() {
    await Locker.lock('Token assets extra info invalidations', async () => {
      const assets = await this.tokenAssetService.getAllAssets();
      for (const identifier of Object.keys(assets)) {
        const asset = assets[identifier];

        if (asset.lockedAccounts) {
          const lockedAccounts = await this.esdtService.getLockedAccountsRaw(identifier);
          await this.invalidateKey(CacheInfo.TokenLockedAccounts(identifier).key, lockedAccounts, CacheInfo.TokenLockedAccounts(identifier).ttl);
        }

        if (asset.extraTokens) {
          const accounts = await this.esdtService.countAllAccounts([identifier, ...asset.extraTokens]);
          await this.cachingService.setCacheRemote(
            CacheInfo.TokenAccountsExtra(identifier).key,
            accounts,
            CacheInfo.TokenAccountsExtra(identifier).ttl
          );
        }
      }
    }, true);
  }

  async handleIdentityInvalidations() {
    await Locker.lock('Identities invalidations', async () => {
      const identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.invalidateKey(CacheInfo.Identities.key, identities, CacheInfo.Identities.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProviderInvalidations() {
    await Locker.lock('Providers invalidations', async () => {
      const providers = await this.providerService.getAllProvidersRaw();
      await this.invalidateKey(CacheInfo.Providers.key, providers, CacheInfo.Providers.ttl);

      const providersWithStakeInformation = await this.providerService.getProvidersWithStakeInformationRaw();
      await this.invalidateKey(CacheInfo.ProvidersWithStakeInformation.key, providersWithStakeInformation, CacheInfo.ProvidersWithStakeInformation.ttl);
    }, true);
  }

  async handleKeybaseAgainstCacheInvalidations() {
    await Locker.lock('Keybase against cache invalidations', async () => {
      const nodesAndProvidersKeybases = await this.keybaseService.confirmKeybasesAgainstCache();
      const identityProfilesKeybases = await this.keybaseService.getIdentitiesProfilesAgainstCache();
      await Promise.all([
        this.invalidateKey(CacheInfo.Keybases.key, nodesAndProvidersKeybases, CacheInfo.Keybases.ttl),
        this.invalidateKey(CacheInfo.IdentityProfilesKeybases.key, identityProfilesKeybases, CacheInfo.IdentityProfilesKeybases.ttl),
      ]);

      await this.handleNodeInvalidations();
      await this.handleProviderInvalidations();
      await this.handleIdentityInvalidations();
    }, true);
  }

  async handleKeybaseAgainstKeybasePubInvalidations() {
    await Locker.lock('Keybase against keybase.pub / keybase.io invalidations', async () => {
      await this.keybaseService.confirmKeybasesAgainstKeybasePub();
      await this.keybaseService.confirmIdentityProfilesAgainstKeybaseIo();

      await this.handleKeybaseAgainstCacheInvalidations();
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCurrentPriceInvalidations() {
    if (this.apiConfigService.getDataUrl()) {
      await Locker.lock('Current price invalidations', async () => {
        const currentPrice = await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price);
        await this.invalidateKey(CacheInfo.CurrentPrice.key, currentPrice, CacheInfo.CurrentPrice.ttl);
      }, true);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEconomicsInvalidations() {
    await Locker.lock('Economics invalidations', async () => {
      const economics = await this.networkService.getEconomicsRaw();
      await this.invalidateKey(CacheInfo.Economics.key, economics, CacheInfo.Economics.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountInvalidations() {
    await Locker.lock('Accounts invalidations', async () => {
      const accounts = await this.accountService.getAccountsRaw({ from: 0, size: 25 });
      await this.invalidateKey(CacheInfo.Top25Accounts.key, accounts, CacheInfo.Top25Accounts.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleHeartbeatStatusInvalidations() {
    await Locker.lock('Heartbeatstatus invalidations', async () => {
      const result = await this.gatewayService.getRaw('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
      await this.invalidateKey('heartbeatstatus', JSON.stringify(result.data), Constants.oneMinute() * 2);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleValidatorStatisticsInvalidations() {
    await Locker.lock('Validator statistics invalidations', async () => {
      const result = await this.gatewayService.getRaw('validator/statistics', GatewayComponentRequest.validatorStatistics);
      await this.invalidateKey('validatorstatistics', JSON.stringify(result.data), Constants.oneMinute() * 2);
    }, true);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleTokenAssetsInvalidations() {
    await Locker.lock('Token assets invalidations', async () => {
      await this.tokenAssetService.checkout();
      const assets = await this.tokenAssetService.getAllAssetsRaw();
      await this.invalidateKey(CacheInfo.TokenAssets.key, assets, CacheInfo.TokenAssets.ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexInvalidations() {
    await Locker.lock('Refreshing mex pairs', async () => {
      await this.mexPairsService.refreshMexPairs();
    }, true);

    await Locker.lock('Refreshing mex economics', async () => {
      await this.mexEconomicsService.refreshMexEconomics();
    }, true);

    await Locker.lock('Refreshing mex tokens', async () => {
      await this.mexTokensService.refreshMexTokens();
    }, true);

    await Locker.lock('Refreshing mex farms', async () => {
      await this.mexFarmsService.refreshMexFarms();
    }, true);

    await Locker.lock('Refreshing mex settings', async () => {
      await this.mexSettingsService.refreshSettings();
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleUpdateAssetsInElastic() {
    await Locker.lock('Update assets in elastic', async () => {
      const allAssets = await this.tokenAssetService.getAllAssets();

      for (const key of Object.keys(allAssets)) {
        const elasticAssets = await this.elasticService.getCustomValue('tokens', key, 'assets');
        if (elasticAssets === null) {
          this.logger.log(`Could not find token with identifier '${key}' when updating assets in elastic`);
          continue;
        }

        const githubAssets = allAssets[key];

        if (!elasticAssets || JsonDiff.diff(githubAssets, elasticAssets)) {
          this.logger.log(`Updating assets for token with identifier '${key}'`);
          await this.elasticService.setCustomValue('tokens', key, 'assets', githubAssets);
        }
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleMexSettings() {
    await Locker.lock('Mex settings invalidations', async () => {
      const settings = await this.mexSettingsService.getSettingsRaw();
      if (settings) {
        await this.invalidateKey(CacheInfo.MexSettings.key, settings, CacheInfo.MexSettings.ttl);
      }
    });
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cachingService.setCache(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit('refreshCacheKey', { key, ttl });
  }
}
