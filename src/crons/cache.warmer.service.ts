import { Inject, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { DataApiService } from "src/common/data.api.service";
import { DataQuoteType } from "src/common/entities/data.quote.type";
import { KeybaseService } from "src/common/keybase.service";
import { Constants } from "src/utils/constants";
import { Locker } from "src/utils/locker";
import { CachingService } from "src/common/caching.service";
import { ClientProxy } from "@nestjs/microservices";
import { ApiConfigService } from "src/common/api.config.service";
import { NetworkService } from "src/endpoints/network/network.service";
import { AccountService } from "src/endpoints/accounts/account.service";

@Injectable()
export class CacheWarmerService {

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly identitiesService: IdentitiesService,
    private readonly providerService: ProviderService,
    private readonly keybaseService: KeybaseService,
    private readonly dataApiService: DataApiService,
    private readonly cachingService: CachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly apiConfigService: ApiConfigService,
    private readonly networkService: NetworkService,
    private readonly accountService: AccountService,
  ) { }

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    await Locker.lock('Nodes invalidations', async () => {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.invalidateKey('nodes', nodes, Constants.oneHour());
    }, true);
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    await Locker.lock('Tokens invalidations', async () => {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.invalidateKey('allTokens', tokens, Constants.oneHour());
    }, true);
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    await Locker.lock('Identities invalidations', async () => {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.invalidateKey('identities', identities, Constants.oneMinute() * 15);
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleProviderInvalidations() {
    await Locker.lock('Providers invalidations', async () => {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.invalidateKey('providers', providers, Constants.oneHour());
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleKeybaseInvalidations() {
    await Locker.lock('Keybase invalidations', async () => {
      let nodeKeybases = await this.keybaseService.confirmKeybaseNodesAgainstKeybasePub();
      let providerKeybases = await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub();
      let identityKeybases = await this.keybaseService.getIdentitiesProfilesAgainstKeybasePub();
      await Promise.all([
        this.invalidateKey('nodeKeybases', nodeKeybases, Constants.oneHour()),
        this.invalidateKey('providerKeybases', providerKeybases, Constants.oneHour()),
        this.invalidateKey('identityKeybases', identityKeybases, Constants.oneHour())
      ]);
    }, true);
  }

  @Cron('* * * * *')
  async handleCurrentPriceInvalidations() {
    if (this.apiConfigService.getDataUrl()) {
      await Locker.lock('Current price invalidations', async () => {
        let currentPrice = await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price);
        await this.invalidateKey('currentPrice', currentPrice, Constants.oneHour());
      }, true);
    }
  }

  @Cron('* * * * *')
  async handleEconomicsInvalidations() {
    await Locker.lock('Economics invalidations', async () => {
      let economics = await this.networkService.getEconomics();
      await this.invalidateKey('economics', economics, Constants.oneMinute() * 10);
    }, true);
  }

  @Cron('* * * * *')
  async handleAccountInvalidations() {
    await Locker.lock('Accounts invalidations', async () => {
      let accounts = await this.accountService.getAccounts({ from: 0, size: 25 });
      await this.invalidateKey('accounts:0:25', accounts, Constants.oneMinute() * 2);
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