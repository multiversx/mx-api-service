import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiConfigService } from "src/helpers/api.config.service";
import { denominateString } from "src/helpers/helpers";
import { AccountService } from "../accounts/account.service";
import { NodeStatus } from "../nodes/entities/node.status";
import { NodeService } from "../nodes/node.service";
import { ProviderQuery } from "../providers/entities/provider.query";
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

    let totalQueued = 0;
    let realStaked = totalStaked;
    for (let queuedNodeWithoutIdentity of queuedNodes.filter(x => !x.identity)) {
      realStaked = realStaked - denominateString(queuedNodeWithoutIdentity.stake);
      totalQueued += 2500;
    }

    let queuedNodesWithIdentity = queuedNodes.filter(x => x.identity);
    console.log({queueNodeCount: queuedNodesWithIdentity.length});

    let allProviders = await this.providerService.getProviders(new ProviderQuery());
    console.log({providers: allProviders.length});


    let groupedQueuedNodesWithIdentity = queuedNodesWithIdentity.groupBy(x => x.identity);
    for (let identity of Object.keys(groupedQueuedNodesWithIdentity)) {
      let provider = allProviders.firstOrUndefined(x => x.identity === identity);
      if (provider) {
        let totalNodes = provider.numNodes;
        let queuedNodes = groupedQueuedNodesWithIdentity[identity].length;

        let stakeAmount = denominateString(provider.stake);
        let queueRatio = queuedNodes / ( queuedNodes + totalNodes );
        let queuedAmount = stakeAmount * queueRatio;

        console.log({identity, totalNodes, queueRatio, queuedNodes, stakeAmount, queuedAmount});

        realStaked = realStaked - queuedAmount;
        totalQueued += queuedAmount;
      }
    }

    let firstYear = 1952123.4;
    let apr = firstYear / realStaked;
    let queuedNodesWithoutIdentity = queuedNodes.filter(x => !x.identity).length;

    console.log({totalStaked, realStaked, firstYear, apr, totalQueued, queuedNodesWithoutIdentity });

    return apr;
  }
}