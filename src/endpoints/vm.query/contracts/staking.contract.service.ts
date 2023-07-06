import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class StakingContractService {
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) { }

  async getRewardAddress(blsKey: string) {
    const contractAddres = this.apiConfigService.getStakingContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddres,
      'getRewardAddress',
      undefined,
      [blsKey]
    );
  }

  async getQueueSize() {
    const contractAddres = this.apiConfigService.getStakingContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddres,
      'getQueueSize',
    );
  }

  async getQueueIndex(blsKey: string) {
    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();

    return await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getQueueIndex',
      auctionContractAddress,
      [blsKey]
    );
  }

  async getRemainingUnBondPeriod(blsKey: string) {
    const contractAddres = this.apiConfigService.getStakingContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddres,
      'getRemainingUnBondPeriod',
      undefined,
      [blsKey]
    );
  }
}
