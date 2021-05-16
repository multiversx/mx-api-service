import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { CachingService } from 'src/helpers/caching.service';
import { GatewayService } from 'src/helpers/gateway.service';
import { oneMinute } from 'src/helpers/helpers';
import { VmQueryService } from '../vm.query/vm.query.service';
import { Constants } from './entities/constants';
import { Economics } from './entities/economics';

@Injectable()
export class NetworkService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService
  ) {}

  async getConstants(): Promise<Constants> {
    let gatewayUrl = this.apiConfigService.getGatewayUrl();

    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            // erd_denomination: denomination,
            erd_gas_per_data_byte: gasPerDataByte,
            erd_min_gas_limit: minGasLimit,
            erd_min_gas_price: minGasPrice,
            erd_min_transaction_version: minTransactionVersion,
            // erd_round_duration: roundDuration,
          },
        },
      },
    } = await axios({
      method: 'get',
      url: `${gatewayUrl}/network/config`,
    });

    return { chainId, gasPerDataByte, minGasLimit, minGasPrice, minTransactionVersion };
  }

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
