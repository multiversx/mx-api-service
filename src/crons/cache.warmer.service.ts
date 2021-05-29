import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NodeService } from "src/endpoints/nodes/node.service";
import { TokenService } from "src/endpoints/tokens/token.service";

@Injectable()
export class CacheWarmerService {
  isRunningNodeInvalidations: boolean = false;
  isRunningTokenInvalidations: boolean = false;

  constructor(
    private readonly nodeService: NodeService,
    private readonly tokenService: TokenService
  ) {}

  @Cron('* * * * *')
  async handleNodeInvalidations() {
    if (this.isRunningNodeInvalidations) {
      return;
    }

    this.isRunningNodeInvalidations = true;
    console.log('Started running node invalidations');
    try {
      await this.nodeService.getAllNodesRaw();
      await this.nodeService.getAllNodes();
    } finally {
      console.log('Finished running node invalidations');
      this.isRunningNodeInvalidations = false;
    }
  }

  @Cron('* * * * *')
  async handleTokenInvalidations() {
    if (this.isRunningTokenInvalidations) {
      return;
    }

    this.isRunningTokenInvalidations = true;
    console.log('Started running token invalidations');
    try {
      await this.tokenService.getAllTokensRaw();
      await this.tokenService.getAllTokens();
    } finally {
      console.log('Finished running token invalidations');
      this.isRunningTokenInvalidations = false;
    }
  }
}