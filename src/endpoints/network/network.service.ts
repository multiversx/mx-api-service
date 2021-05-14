import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { Constants } from './entities/Constants';

@Injectable()
export class NetworkService {
  constructor(private readonly apiConfigService: ApiConfigService) {}

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
}
