import { Inject, Injectable } from "@nestjs/common";
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
import { CacheKey } from "src/common/caching/entities/cache.key";

@Injectable()
export class CacheWarmerService {
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
  ) { 
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
    const cronJob = new CronJob(cronTime, async () => await callback())
    this.schedulerRegistry.addCronJob(name, cronJob);
    cronJob.start();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNodeInvalidations() {
    await Locker.lock('Nodes invalidations', async () => {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.invalidateKey(CacheKey.Nodes().key, nodes, CacheKey.Nodes().ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEsdtTokenInvalidations() {
    await Locker.lock('Esdt tokens invalidations', async () => {
      let tokens = await this.esdtService.getAllEsdtTokensRaw();
      await this.invalidateKey(CacheKey.AllEsdtTokens().key, tokens, CacheKey.AllEsdtTokens().ttl);
    }, true);
  }

  async handleIdentityInvalidations() {
    await Locker.lock('Identities invalidations', async () => {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.invalidateKey(CacheKey.Identities().key, identities, CacheKey.Identities().ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProviderInvalidations() {
    await Locker.lock('Providers invalidations', async () => {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.invalidateKey(CacheKey.Providers().key, providers, CacheKey.Providers().ttl);

      let providersWithStakeInformation = await this.providerService.getProvidersWithStakeInformationRaw();
      await this.invalidateKey(CacheKey.ProvidersWithStakeInformation().key, providersWithStakeInformation, CacheKey.ProvidersWithStakeInformation().ttl);
    }, true);
  }

  async handleKeybaseAgainstCacheInvalidations() {
    await Locker.lock('Keybase against cache invalidations', async () => {
      let nodesAndProvidersKeybases = await this.keybaseService.confirmKeybasesAgainstCache();
      let identityProfilesKeybases = await this.keybaseService.getIdentitiesProfilesAgainstCache();
      await Promise.all([
        this.invalidateKey(CacheKey.Keybases().key, nodesAndProvidersKeybases, CacheKey.Keybases().ttl),
        this.invalidateKey(CacheKey.IdentityProfilesKeybases().key, identityProfilesKeybases, CacheKey.IdentityProfilesKeybases().ttl)
      ]);

      await this.handleNodeInvalidations();
      await this.handleProviderInvalidations();
      await this.handleIdentityInvalidations();
    }, true);
  }

  async handleKeybaseAgainstKeybasePubInvalidations() {
    await Locker.lock('Keybase against keybase.pub / keybase.io invalidations', async () => {
      await this.keybaseService.confirmKeybasesAgainstKeybasePub();
      await this.keybaseService.confirmIdentityProfilesAgainstKeybasePub();
      
      await this.handleKeybaseAgainstCacheInvalidations();
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCurrentPriceInvalidations() {
    if (this.apiConfigService.getDataUrl()) {
      await Locker.lock('Current price invalidations', async () => {
        let currentPrice = await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price);
        await this.invalidateKey(CacheKey.CurrentPrice().key, currentPrice, CacheKey.CurrentPrice().ttl);
      }, true);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEconomicsInvalidations() {
    await Locker.lock('Economics invalidations', async () => {
      let economics = await this.networkService.getEconomicsRaw();
      await this.invalidateKey(CacheKey.Economics().key, economics, CacheKey.Economics().ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountInvalidations() {
    await Locker.lock('Accounts invalidations', async () => {
      let accounts = await this.accountService.getAccountsRaw({ from: 0, size: 25 });
      await this.invalidateKey(CacheKey.Top25Accounts().key, accounts, CacheKey.Top25Accounts().ttl);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleHeartbeatStatusInvalidations() {
    await Locker.lock('Heartbeatstatus invalidations', async () => {
      let result = await this.gatewayService.getRaw('node/heartbeatstatus');
      await this.invalidateKey('heartbeatstatus', result.data, Constants.oneMinute() * 2);
    }, true);
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await Promise.all([
      this.cachingService.setCache(key, data, ttl),
      this.deleteCacheKey(key),
    ]);
  }

  private async deleteCacheKey(key: string) {
    await this.clientProxy.emit('deleteCacheKeys', [ key ]);
  }
}