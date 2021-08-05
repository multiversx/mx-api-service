import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { CachingService } from "src/helpers/caching.service";
import { oneHour, oneMinute } from "src/helpers/helpers";
import { KeybaseService } from "src/helpers/keybase.service";
import { PerformanceProfiler } from "src/helpers/performance.profiler";

@Injectable()
export class CacheWarmerService {
  isRunningNodeInvalidations: boolean = false;
  isRunningTokenInvalidations: boolean = false;
  isRunningIdentitiesInvalidations: boolean = false;
  isRunningProviderInvalidations: boolean = false;
  isRunningKeybaseInvalidations: boolean = false;
  private readonly logger: Logger

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly cachingService: CachingService,
    private readonly identitiesService: IdentitiesService,
    private readonly providerService: ProviderService,
    private readonly keybaseService: KeybaseService,
    @Inject('PUBSUB_SERVICE') private client: ClientProxy,
  ) {
    this.logger = new Logger(CacheWarmerService.name);
  }

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    if (this.isRunningNodeInvalidations) {
      return;
    }

    this.isRunningNodeInvalidations = true;
    let profiler = new PerformanceProfiler();
    try {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.cachingService.setCache('nodes', nodes, oneHour());
      await this.deleteCacheKey('nodes');
    } catch(error) {
      this.logger.error('Error running node invalidations');
      this.logger.error(error);
    } finally {
      profiler.stop('Running node invalidations', true);
      this.isRunningNodeInvalidations = false;
    }
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    if (this.isRunningTokenInvalidations) {
      return;
    }

    this.isRunningTokenInvalidations = true;
    let profiler = new PerformanceProfiler();
    try {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.cachingService.setCache('allTokens', tokens, oneHour());
      await this.deleteCacheKey('allTokens');
    } catch(error) {
      this.logger.error('Error running token invalidations');
      this.logger.error(error);
    } finally {
      profiler.stop('Running token invalidations', true);
      this.isRunningTokenInvalidations = false;
    }
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    if (this.isRunningIdentitiesInvalidations) {
      return;
    }

    this.isRunningIdentitiesInvalidations = true;
    let profiler = new PerformanceProfiler();
    try {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.cachingService.setCache('identities', identities, oneMinute() * 15);
      await this.deleteCacheKey('identities');
    } catch(error) {
      this.logger.error('Error running identities invalidations');
      this.logger.error(error);
    } finally {
      profiler.stop('Running identities invalidations', true);
      this.isRunningIdentitiesInvalidations = false;
    }
  }

  @Cron('*/30 * * * *')
  async handleProviderInvalidations() {
    if (this.isRunningProviderInvalidations) {
      return;
    }

    this.isRunningProviderInvalidations = true;
    let profiler = new PerformanceProfiler();
    try {
      let providers = await this.providerService.getAllProvidersRaw();
      await this.cachingService.setCache('providers', providers, oneHour());
      await this.deleteCacheKey('providers');
    } catch(error) {
      this.logger.error('Error running provider invalidations');
      this.logger.error(error);
    } finally {
      profiler.stop('Running provider invalidations', true);
      this.isRunningProviderInvalidations = false;
    }
  }

  @Cron('*/30 * * * *')
  async handleKeybaseInvalidations() {
    if (this.isRunningKeybaseInvalidations) {
      return;
    }

    this.isRunningKeybaseInvalidations = true;
    let profiler = new PerformanceProfiler();
    try {
      let nodeKeybases = await this.keybaseService.confirmKeybaseNodesAgainstKeybasePub();
      await this.cachingService.setCache('nodeKeybases', nodeKeybases, oneHour());
      await this.deleteCacheKey('nodeKeybases');

      let providerKeybases = await this.keybaseService.confirmKeybaseProvidersAgainstKeybasePub();
      await this.cachingService.setCache('providerKeybases', providerKeybases, oneHour());
      await this.deleteCacheKey('providerKeybases');
    } catch(error) {
      this.logger.error('Error running keybase invalidations');
      this.logger.error(error);
    } finally {
      profiler.stop('Running keybase invalidations', true);
      this.isRunningKeybaseInvalidations = false;
    }
  }

  private async deleteCacheKey(key: string) {
    await this.client.emit('deleteCacheKeys', [ key ]);
  }
}