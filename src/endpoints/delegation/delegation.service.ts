import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Delegation } from "./entities/delegation";
import { NodeService } from "../nodes/node.service";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { AccountDelegation } from "../stake/entities/account.delegation";
import { DelegationManagerContractService } from "../vm.query/contracts/delegation.manager.contract.service";

@Injectable()
export class DelegationService {
  private readonly logger = new OriginLogger(DelegationService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
    private readonly nodeService: NodeService,
    private readonly apiService: ApiService,
    private readonly delegationManagerContractService: DelegationManagerContractService
  ) { }

  async getDelegation(): Promise<Delegation> {
    return await this.cachingService.getOrSet(
      CacheInfo.Delegation.key,
      async () => await this.getDelegationRaw(),
      CacheInfo.Delegation.ttl
    );
  }

  async getDelegationRaw(): Promise<Delegation> {
    const configsBase64 = await this.delegationManagerContractService.getContractConfig();

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
