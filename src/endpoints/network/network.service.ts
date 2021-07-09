import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Stats } from 'src/endpoints/network/entities/stats';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { CachingService } from 'src/helpers/caching.service';
import { GatewayService } from 'src/helpers/gateway.service';
import { oneMinute } from 'src/helpers/helpers';
import { AccountService } from '../accounts/account.service';
import { BlockService } from '../blocks/block.service';
import { TransactionService } from '../transactions/transaction.service';
import { VmQueryService } from '../vm.query/vm.query.service';
import { Constants } from './entities/constants';
import { Economics } from './entities/economics';

@Injectable()
export class NetworkService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly vmQueryService: VmQueryService,
    private readonly blockService: BlockService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
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
    const locked = 2890000;
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

  async getStats(): Promise<Stats> {
    const metaChainShard = this.apiConfigService.getMetaChainShardId();
    
    const [
      {
        config: { erd_num_shards_without_meta: shards, erd_round_duration: refreshRate },
      },
      {
        status: {
          erd_epoch_number: epoch,
          erd_rounds_passed_in_current_epoch: roundsPassed,
          erd_rounds_per_epoch: roundsPerEpoch,
        },
      },
      blocks,
      accounts,
      transactions
    ] = await Promise.all([
      this.gatewayService.get('network/config'),
      this.gatewayService.get(`network/status/${metaChainShard}`),
      this.blockService.getBlocksCount(),
      this.accountService.getAccountsCount(),
      this.transactionService.getTransactionCount(),
    ]);

    return {
      shards,
      blocks,
      accounts,
      transactions,
      refreshRate,
      epoch,
      roundsPassed,
      roundsPerEpoch,
    }
  }

  async getValidatorStatistics() {
    return await this.gatewayService.get('validator/statistics');
  }
}
