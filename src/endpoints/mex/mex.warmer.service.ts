import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ClientProxy } from "@nestjs/microservices";
import { CacheInfo } from "src/utils/cache.info";
import { MexSettingsService } from "src/endpoints/mex/mex.settings.service";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import { CachingService, Lock, Locker } from "@multiversx/sdk-nestjs";

@Injectable()
export class MexWarmerService {
  constructor(
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly mexEconomicsService: MexEconomicsService,
    private readonly mexPairsService: MexPairService,
    private readonly mexTokensService: MexTokenService,
    private readonly mexSettingsService: MexSettingsService,
    private readonly mexFarmsService: MexFarmService,
  ) { }

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

  @Cron(CronExpression.EVERY_10_MINUTES)
  @Lock({ name: 'Mex settings invalidations' })
  async handleMexSettings() {
    const settings = await this.mexSettingsService.getSettingsRaw();
    if (settings) {
      await this.invalidateKey(CacheInfo.MexSettings.key, settings, CacheInfo.MexSettings.ttl);
    }
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cachingService.setCache(key, data, ttl);
    await this.refreshCacheKey(key, ttl);
  }

  private async refreshCacheKey(key: string, ttl: number) {
    await this.clientProxy.emit('refreshCacheKey', { key, ttl });
  }
}
