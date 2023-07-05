import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';

@Injectable()
export class StakingContractAddressService {
  constructor(private vmQueryService: VmQueryService) { }

  async getRewardAddress(stakingContractAddress: string, blsKey: string) {
    return await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getRewardAddress',
      undefined,
      [blsKey]
    );
  }

  async getQueueSize(stakingContractAddress: string) {
    return await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getQueueSize',
    );
  }

  async getQueueIndex(stakingContractAddress: string, auctionContractAddress: string, blsKey: string) {
    return await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getQueueIndex',
      auctionContractAddress,
      [blsKey]
    );
  }
}
