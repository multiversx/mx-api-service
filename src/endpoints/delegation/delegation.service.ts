import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Delegation } from "./entities/delegation";
import { NodeService } from "../nodes/node.service";
import { Constants } from "src/utils/constants";

@Injectable()
export class DelegationService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly nodeService: NodeService
  ) {}

  async getDelegation(): Promise<Delegation> {
    return this.cachingService.getOrSetCache(
      'delegation',
      async () => await this.getDelegationRaw(),
      Constants.oneMinute() * 10
    );
  }

  async getDelegationRaw(): Promise<Delegation> {
    const configsBase64 = await this.vmQueryService.vmQuery(
      this.apiConfigService.getDelegationManagerContractAddress(),
      'getContractConfig',
    );

    let nodes = await this.nodeService.getAllNodes();
    let providerAddresses = nodes.map(node => node.provider ? node.provider : node.owner);

    providerAddresses = [...new Set(providerAddresses)];

    // @ts-ignore
    const minDelegationHex = Buffer.from(configsBase64.pop(), 'base64').toString('hex');
    const minDelegation = BigInt(
      minDelegationHex ? '0x' + minDelegationHex : minDelegationHex
    ).toString();

    const { stake, topUp } = nodes.reduce(
      (accumulator, { stake, topUp }) => {
        accumulator.stake += BigInt(stake);
        accumulator.topUp += BigInt(topUp);

        return accumulator;
      },
      {
        stake: BigInt(0),
        topUp: BigInt(0),
      }
    );

    return {
      stake: stake.toString(),
      topUp: topUp.toString(),
      locked: (stake + topUp).toString(),
      minDelegation,
    };
  }
}