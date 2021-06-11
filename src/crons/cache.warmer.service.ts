import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NodeService } from "src/endpoints/nodes/node.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { CachingService } from "src/helpers/caching.service";
import { oneHour } from "src/helpers/helpers";
import { PerformanceProfiler } from "src/helpers/performance.profiler";

@Injectable()
export class CacheWarmerService {
  isRunningNodeInvalidations: boolean = false;
  isRunningTokenInvalidations: boolean = false;
  isRunningNftInvalidations: boolean = false;

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService,
    private readonly cachingService: CachingService
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
      this.cachingService.setCache('nodes', nodes, oneHour());
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
    let profiler = new PerformanceProfiler('Running node invalidations');
    try {
      await this.tokenService.getAllTokensRaw();
      await this.tokenService.getAllTokens();
    } finally {
      profiler.stop();
      this.isRunningTokenInvalidations = false;
    }
  }

  @Cron('* * * * *')
  async handleNftInvalidations() {
    if (this.isRunningNftInvalidations) {
      return;
    }

    this.isRunningNftInvalidations = true;
    let profiler = new PerformanceProfiler('Running NFT invalidations');
    try {
      await this.tokenService.getAllNftsRaw();
      await this.tokenService.getAllNfts();
    } finally {
      profiler.stop();
      this.isRunningNftInvalidations = false;
    }
  }
}