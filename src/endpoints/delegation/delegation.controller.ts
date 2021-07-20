import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiConfigService } from "src/helpers/api.config.service";
import { denominateString } from "src/helpers/helpers";
import { AccountService } from "../accounts/account.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { NodeService } from "../nodes/node.service";
import { ProviderFilter } from "../providers/entities/provider.filter";
import { ProviderService } from "../providers/provider.service";
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
    private readonly providerService: ProviderService
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
    console.log({totalStaked});

    let allNodes = await this.nodeService.getAllNodes();
    let queuedNodes = allNodes.filter(x => x.status === NodeStatus.queued);

    console.log({queuedNodes: queuedNodes.length});

    let totalQueued = 0;
    let realStaked = totalStaked;
    // for (let queuedNodeWithoutIdentity of queuedNodes.filter(x => !x.identity)) {
    //   realStaked = realStaked - denominateString(queuedNodeWithoutIdentity.stake);
    //   totalQueued += 2500;
    // }

    let allProviders = await this.providerService.getProviders(new ProviderFilter());
    console.log({providers: allProviders.length});

    let totalQueuedNodes = 0;

    let groupedQueuedNodesWithOwner = queuedNodes.groupBy(x => x.owner);
    for (let owner of Object.keys(groupedQueuedNodesWithOwner)) {
      let totalLocked = BigInt(0);
      let nodesWithSameOwner = allNodes.filter(x => x.owner === owner);
      for (let node of nodesWithSameOwner) {
        totalLocked += BigInt(node.locked);
      }

      let totalNodes = nodesWithSameOwner.length;
      let queuedNodes = groupedQueuedNodesWithOwner[owner].length;
      totalQueuedNodes += queuedNodes;

      let lockedAmount = denominateString(totalLocked.toString());
      let queueRatio = queuedNodes / totalNodes;
      let queuedAmount = lockedAmount * queueRatio;

      console.log({owner, totalNodes, queueRatio, queuedNodes, lockedAmount, queuedAmount});

      realStaked = realStaked - queuedAmount;
      totalQueued += queuedAmount;
    }

    let firstYear = 1952123.4;
    let apr = firstYear / realStaked;
    let queuedNodesWithoutIdentity = queuedNodes.filter(x => !x.identity).length;

    console.log({totalStaked, realStaked, firstYear, apr, totalQueued, queuedNodesWithoutIdentity, totalQueuedNodes });

    return apr;
  }
}