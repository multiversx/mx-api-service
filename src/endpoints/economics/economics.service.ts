import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { GatewayService } from "src/helpers/gateway.service";
import { oneMinute } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Economics } from "./entities/economics";

@Injectable()
export class EconomicsService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService
  ) {}

  async getEconomics(): Promise<Economics> {
    return this.cachingService.getOrSetCache(
      'economics',
      async () => await this.getEconomicsRaw(),
      oneMinute() * 10
    );
  }

  private async getEconomicsRaw(): Promise<Economics> {
    const locked = 4020000;
    const [
      { account: { balance } },
      { metrics: { erd_total_supply } },
      [, totalWaitingStakeBase64],
    ] = await Promise.all([
      this.gatewayService.get(`address/${this.apiConfigService.getAuctionContractAddress()}`),
      this.gatewayService.get('network/economics'),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getTotalStakeByType',
      ),
    ]);

    const totalWaitingStakeHex = Buffer.from(totalWaitingStakeBase64, 'base64').toString('hex');
    let totalWaitingStake = BigInt(
      totalWaitingStakeHex ? '0x' + totalWaitingStakeHex : totalWaitingStakeHex
    );

    const staked = parseInt((BigInt(balance) + totalWaitingStake).toString().slice(0, -18));
    const totalSupply = parseInt(erd_total_supply.slice(0, -18));

    const circulatingSupply = totalSupply - locked;

    return { totalSupply, circulatingSupply, staked };
  }
}