import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { CachingService } from "src/helpers/caching.service";
import { lock, oneHour, oneMinute } from "src/helpers/helpers";
import { KeybaseService } from "src/helpers/keybase.service";

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
  ) { }

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    await lock('Nodes invalidations', async () => {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.cachingService.setCache('nodes', nodes, oneHour());
      await this.deleteCacheKey('nodes');
    }, true);
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    await lock('Tokens invalidations', async () => {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.cachingService.setCache('allTokens', tokens, oneHour());
      await this.deleteCacheKey('allTokens');
    }, true);
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    await lock('Identities invalidations', async () => {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.cachingService.setCache('identities', identities, oneMinute() * 15);
      await this.deleteCacheKey('identities');
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleProviderInvalidations() {
    await lock('Providers invalidations', async () => {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.cachingService.setCache('providers', providers, oneHour());
      await this.deleteCacheKey('providers');
    }, true);
  }

  @Cron('*/30 * * * *')
  async handleKeybaseInvalidations() {
    await lock('Keybase invalidations', async () => {
      let nodeKeybases = await this.keybaseService.confirmKeybaseNodesAgainstKeybasePub();
      await this.cachingService.setCache('nodeKeybases', nodeKeybases, oneHour());
      await this.deleteCacheKey('nodeKeybases');

      let providerKeybases = await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub();
      await this.cachingService.setCache('providerKeybases', providerKeybases, oneHour());
      await this.deleteCacheKey('providerKeybases');
    }, true);
  }

  private async deleteCacheKey(key: string) {
    await this.client.emit('deleteCacheKeys', [ key ]);
  }
}