import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { oneMinute } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { ProviderService } from "../providers/provider.service";
import { StakeService } from "../stake/stake.service";
import { Delegation } from "./entities/delegation";

@Injectable()
export class DelegationService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    private readonly providerService: ProviderService,
    private readonly cachingService: CachingService,
    private readonly stakeService: StakeService
  ) {}

  async getDelegation(): Promise<Delegation> {
    return this.cachingService.getOrSetCache(
      'delegation',
      async () => await this.getDelegationRaw(),
      oneMinute() * 10
    );
  }

  async getDelegationRaw(): Promise<Delegation> {
    const [providers, configsBase64] = await Promise.all([
      this.providerService.getAllProviders(),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationManagerContractAddress(),
        'getContractConfig',
      ),
    ]);

    // @ts-ignore
    const minDelegationHex = Buffer.from(configsBase64.pop(), 'base64').toString('hex');
    const minDelegation = BigInt(
      minDelegationHex ? '0x' + minDelegationHex : minDelegationHex
    ).toString();

    const addresses = providers.map(({ provider }) => provider);

    const stakes = await this.stakeService.getStakes(addresses);

    const { stake, topUp } = stakes.reduce(
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