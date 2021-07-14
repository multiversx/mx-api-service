import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { CachingService } from "src/helpers/caching.service";
import { oneHour, oneMinute } from "src/helpers/helpers";
import { PerformanceProfiler } from "src/helpers/performance.profiler";

@Injectable()
export class CacheWarmerService {
  isRunningNodeInvalidations: boolean = false;
  isRunningTokenInvalidations: boolean = false;
  isRunningIdentitiesInvalidations: boolean = false;

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly cachingService: CachingService,
    private readonly identitiesService: IdentitiesService,
  ) {}

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    if (this.isRunningNodeInvalidations) {
      return;
    }

    this.isRunningNodeInvalidations = true;
    let profiler = new PerformanceProfiler('Running node invalidations');
    try {
      let nodes = await this.nodeService.getAllNodesRaw();
      await this.cachingService.setCache('nodes', nodes, oneHour());
    } finally {
      profiler.stop();
      this.isRunningNodeInvalidations = false;
    }
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    if (this.isRunningTokenInvalidations) {
      return;
    }

    this.isRunningTokenInvalidations = true;
    let profiler = new PerformanceProfiler('Running token invalidations');
    try {
      let tokens = await this.tokenService.getAllTokensRaw();
      await this.cachingService.setCache('allTokens', tokens, oneHour());
    } finally {
      profiler.stop();
      this.isRunningTokenInvalidations = false;
    }
  }

  @Cron('*/7 * * * *')
  async handleIdentityInvalidations() {
    if (this.isRunningIdentitiesInvalidations) {
      return;
    }

    this.isRunningIdentitiesInvalidations = true;
    let profiler = new PerformanceProfiler('Running identities invalidations');
    try {
      let identities = await this.identitiesService.getAllIdentitiesRaw();
      await this.cachingService.setCache('identities', identities, oneMinute() * 15);
    } finally {
      profiler.stop();
      this.isRunningIdentitiesInvalidations = false;
    }
  }
}