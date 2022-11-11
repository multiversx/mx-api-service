import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Delegation } from "./entities/delegation";
import { NodeService } from "../nodes/node.service";
import { ApiService, CachingService, OriginLogger } from "@elrondnetwork/erdnest";
import { CacheInfo } from "src/utils/cache.info";
import { AccountDelegation } from "../stake/entities/account.delegation";

@Injectable()
export class DelegationService {
  private readonly logger = new OriginLogger(DelegationService.name);

  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService,
  ) { }

  async getDelegation(): Promise<Delegation> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Delegation.key,
      async () => await this.getDelegationRaw(),
      CacheInfo.Delegation.ttl
    );
  }

  async getDelegationRaw(): Promise<Delegation> {
    const configsBase64 = await this.vmQueryService.vmQuery(
      this.apiConfigService.getDelegationManagerContractAddress(),
      'getContractConfig',
    );

    const nodes = await this.nodeService.getAllNodes();
    let providerAddresses = nodes.map(node => node.provider ? node.provider : node.owner);

    providerAddresses = providerAddresses.distinct();

    // @ts-ignore
    const minDelegationHex = Buffer.from(configsBase64.pop(), 'base64').toString('hex');
    const minDelegation = BigInt(
      minDelegationHex ? '0x' + minDelegationHex : minDelegationHex
    ).toString();

    const { stake, topUp } = nodes.reduce(
      (accumulator, { stake, topUp }) => {
        accumulator.stake += stake ? BigInt(stake) : BigInt(0);
        accumulator.topUp += topUp ? BigInt(topUp) : BigInt(0);

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

  async getDelegationForAddress(address: string): Promise<AccountDelegation[]> {
    try {
      const { data } = await this.apiService.get(`${this.apiConfigService.getDelegationUrl()}/accounts/${address}/delegations`);
      return data;
    } catch (error) {
      this.logger.error(`Error when getting account delegation details for address ${address}`);
      this.logger.error(error);
      throw error;
    }
  }
}
