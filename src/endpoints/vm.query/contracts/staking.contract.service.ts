import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class StakingContractService {
  private contractAddress: string;

  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) {
    this.contractAddress = this.apiConfigService.getStakingContractAddress();
  }

  async getRewardAddress(blsKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getRewardAddress',
      undefined,
      [blsKey]
    );
  }

  async getQueueSize() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getQueueSize',
    );
  }

  async getQueueIndex(blsKey: string) {
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();

    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getQueueIndex',
      auctionContractAddress,
      [blsKey]
    );
  }

  async getRemainingUnBondPeriod(blsKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getRemainingUnBondPeriod',
      undefined,
      [blsKey]
    );
  }
}
