import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiConfigService } from "src/helpers/api.config.service";
import { GatewayService } from "src/helpers/gateway.service";
import { denominateString } from "src/helpers/helpers";
import { AccountService } from "../accounts/account.service";
import { BlockService } from "../blocks/block.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { NodeService } from "../nodes/node.service";
import { DelegationService } from "./delegation.service";
import { Delegation } from "./entities/delegation";

@Controller()
@ApiTags('delegation')
export class DelegationController {
  constructor(
    private readonly delegationService: DelegationService,
    private readonly accountService: AccountService,
    private readonly apiConfigService: ApiConfigService,
    private readonly nodeService: NodeService,
    private readonly gatewayService: GatewayService,
    private readonly blockService: BlockService
  ) {}

  @Get("/delegation")
  @ApiResponse({
    status: 200,
    description: 'The delegation details',
    type: Delegation
  })
  async getDelegationDetails(): Promise<Delegation> {
    return await this.delegationService.getDelegation();
  }

  @Get("/apr")
  @ApiResponse({
    status: 200,
    description: 'The APR info',
    type: Number
  })
  async getApr(): Promise<number> {
    let auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    let auctionAccount = await this.accountService.getAccount(auctionContractAddress);
    let totalStaked = denominateString(auctionAccount.balance);

    let allNodes = await this.nodeService.getAllNodes();
    let queuedNodes = allNodes.filter(x => x.status === NodeStatus.queued);

    let realStaked = totalStaked;

    let groupedQueuedNodesWithOwner = queuedNodes.groupBy(x => x.owner);
    for (let owner of Object.keys(groupedQueuedNodesWithOwner)) {
      let totalLocked = BigInt(0);
      let nodesWithSameOwner = allNodes.filter(x => x.owner === owner);
      for (let node of nodesWithSameOwner) {
        totalLocked += BigInt(node.locked);
      }

      let totalNodes = nodesWithSameOwner.length;
      let queuedNodes = groupedQueuedNodesWithOwner[owner].length;

      let lockedAmount = denominateString(totalLocked.toString());
      let queueRatio = queuedNodes / totalNodes;
      let queuedAmount = lockedAmount * queueRatio;

      realStaked = realStaked - queuedAmount;
    }

    let networkConfig = await this.gatewayService.get('network/config');
    let roundSeconds = networkConfig.config.erd_round_duration / 1000;
    let roundsPerEpoch = networkConfig.config.erd_rounds_per_epoch;
    let epochSeconds = roundSeconds * roundsPerEpoch;

    let yearSeconds = 3600 * 24 * 365;
    let epochsInYear = yearSeconds / epochSeconds;

    let currentEpoch = await this.blockService.getCurrentEpoch();

    let yearIndex = Math.floor(currentEpoch / epochsInYear);
    let inflationAmounts = this.apiConfigService.getInflationAmounts();

    if (yearIndex >= inflationAmounts.length) {
      throw new Error(`There is no inflation information for year with index ${yearIndex}`);
    }

    let inflation = inflationAmounts[yearIndex];
    return inflation / realStaked;
  }
}