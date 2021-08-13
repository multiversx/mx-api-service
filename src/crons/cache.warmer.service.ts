import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { CachingService } from "src/helpers/caching.service";
import { DataApiService } from "src/helpers/data.api.service";
import { DataQuoteType } from "src/helpers/entities/data.quote.type";
import { KeybaseService } from "src/helpers/keybase.service";
import { Constants } from "src/utils/constants";
import { Locker } from "src/utils/locker";

@Injectable()
export class CacheWarmerService {

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly cachingService: CachingService,
    private readonly identitiesService: IdentitiesService,
    private readonly providerService: ProviderService,
    private readonly keybaseService: KeybaseService,
    @Inject('PUBSUB_SERVICE') private client: ClientProxy,
    private readonly dataApiService: DataApiService,
  ) { }

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    await Locker.lock('Nodes invalidations', async () => {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.cachingService.setCache('nodes', nodes, Constants.oneHour());
      await this.deleteCacheKey('nodes');
    }, true);
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    await Locker.lock('Tokens invalidations', async () => {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.cachingService.setCache('allTokens', tokens, Constants.oneHour());
      await this.deleteCacheKey('allTokens');
    }, true);
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    await Locker.lock('Identities invalidations', async () => {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.cachingService.setCache('identities', identities, Constants.oneMinute() * 15);
      await this.deleteCacheKey('identities');
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleProviderInvalidations() {
    await Locker.lock('Providers invalidations', async () => {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.cachingService.setCache('providers', providers, Constants.oneHour());
      await this.deleteCacheKey('providers');
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleKeybaseInvalidations() {
    await Locker.lock('Keybase invalidations', async () => {
      let nodeKeybases = await this.keybaseService.confirmKeybaseNodesAgainstKeybasePub();
      await this.cachingService.setCache('nodeKeybases', nodeKeybases, Constants.oneHour());
      await this.deleteCacheKey('nodeKeybases');

      let providerKeybases = await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub();
      await this.cachingService.setCache('providerKeybases', providerKeybases, Constants.oneHour());
      await this.deleteCacheKey('providerKeybases');
    }, true);
  }

  @Cron('* * * * *')
  async handleCurrentPriceInvalidations() {
    await Locker.lock('Current price invalidations', async () => {
      let currentPrice = await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price);
      await this.cachingService.setCache('currentPrice', currentPrice, Constants.oneHour());
      await this.deleteCacheKey('currentPrice');
    }, true);
  }

  private async deleteCacheKey(key: string) {
    await this.client.emit('deleteCacheKeys', [ key ]);
  }
}