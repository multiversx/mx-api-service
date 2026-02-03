import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ClientProxy } from "@nestjs/microservices";
import { CacheInfo } from "src/utils/cache.info";
import { MexSettingsService } from "src/endpoints/mex/mex.settings.service";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import { Lock, Locker } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class MexWarmerService {
  constructor(
    private readonly cachingService: CacheService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexPairsService: MexPairService,
    private readonly mexTokensService: MexTokenService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexFarmsService: MexFarmService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexInvalidations() {
    // Run only when both Exchange and CacheWarmer are enabled
    if (!this.apiConfigService.isExchangeEnabled() || !this.apiConfigService.getIsCacheWarmerCronActive()) {
      return;
    }
    await Locker.lock('Refreshing mex pairs', async () => {
      await this.mexPairsService.refreshMexPairs();
      this.emitDeleteLocal([
        CacheInfo.MexPairs.key,
        CacheInfo.MexPairsWithFarms.key,
      ]);
    }, true);

    await Locker.lock('Refreshing mex economics', async () => {
      await this.mexEconomicsService.refreshMexEconomics();
      this.emitDeleteLocal([
        CacheInfo.MexEconomics.key,
      ]);
    }, true);

    await Locker.lock('Refreshing mex tokens', async () => {
      await this.mexTokensService.refreshMexTokens();
      this.emitDeleteLocal([
        CacheInfo.MexTokens.key,
        CacheInfo.MexTokenTypes.key,
        CacheInfo.MexTokensIndexed.key,
        CacheInfo.MexPrices.key,
      ]);
    }, true);

    await Locker.lock('Refreshing mex farms', async () => {
      await this.mexFarmsService.refreshMexFarms();
      this.emitDeleteLocal([
        CacheInfo.MexFarms.key,
      ]);
    }, true);

    await Locker.lock('Refreshing mex settings', async () => {
      await this.mexSettingsService.refreshSettings();
      this.emitDeleteLocal([
        CacheInfo.MexSettings.key,
        CacheInfo.MexContracts.key,
      ]);
    }, true);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Lock({ name: 'Mex settings invalidations' })
  async handleMexSettings() {
    if (!this.apiConfigService.isExchangeEnabled() || !this.apiConfigService.getIsCacheWarmerCronActive()) {
      return;
    }
    const settings = await this.mexSettingsService.getSettingsRaw();
    if (settings) {
      await this.invalidateKey(CacheInfo.MexSettings.key, settings, CacheInfo.MexSettings.ttl);
      this.emitDeleteLocal([
        CacheInfo.MexSettings.key,
      ]);
    }
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cachingService.set(key, data, ttl);
    this.refreshCacheKey(key, ttl);
  }

  private refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit('refreshCacheKey', { key, ttl });
  }

  private emitDeleteLocal(keys: string[]) {
    if (!keys || keys.length === 0) {
      return;
    }
    this.clientProxy.emit('deleteCacheKeys', keys);
  }
}
