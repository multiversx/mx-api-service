import { Injectable } from "@nestjs/common";
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
import { InvalidateService } from "src/common/invalidate.service";

@Injectable()
export class CacheWarmerService {

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly identitiesService: IdentitiesService,
    private readonly providerService: ProviderService,
    private readonly keybaseService: KeybaseService,
    private readonly invalidateService: InvalidateService,
    private readonly dataApiService: DataApiService,
  ) { }

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    await Locker.lock('Nodes invalidations', async () => {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.invalidateService.invalidateKey('nodes', nodes, Constants.oneHour());
    }, true);
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    await Locker.lock('Tokens invalidations', async () => {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.invalidateService.invalidateKey('allTokens', tokens, Constants.oneHour());
    }, true);
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    await Locker.lock('Identities invalidations', async () => {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.invalidateService.invalidateKey('identities', identities, Constants.oneMinute() * 15);
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleProviderInvalidations() {
    await Locker.lock('Providers invalidations', async () => {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.invalidateService.invalidateKey('providers', providers, Constants.oneHour());
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleKeybaseInvalidations() {
    await Locker.lock('Keybase invalidations', async () => {
      let nodeKeybases = await this.keybaseService.confirmKeybaseNodesAgainstKeybasePub();
      let providerKeybases = await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub();
      await Promise.all([
        this.invalidateService.invalidateKey('nodeKeybases', nodeKeybases, Constants.oneHour()),
        this.invalidateService.invalidateKey('providerKeybases', providerKeybases, Constants.oneHour())
      ]);
    }, true);
  }

  @Cron('* * * * *')
  async handleCurrentPriceInvalidations() {
    await Locker.lock('Current price invalidations', async () => {
      let currentPrice = await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price);
      await this.invalidateService.invalidateKey('currentPrice', currentPrice, Constants.oneHour());
    }, true);
  }
}