import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class DelegationContractService {
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService
  ) { }

  async getUserDeferredPaymentList(publicKey: string) {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getUserDeferredPaymentList',
      undefined,
      [publicKey]
    );
  }

  async getNumBlocksBeforeUnBond() {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getNumBlocksBeforeUnBond'
    );
  }

  async getTotalStakeByType() {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getTotalStakeByType',
    );
  }

  async getNumUsers() {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getNumUsers',
    );
  }

  async getUserStakeByType(publicKey: string) {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getUserStakeByType',
      undefined,
      [publicKey]
    );
  }

  async getClaimableRewards(publicKey: string) {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getClaimableRewards',
      undefined,
      [publicKey]
    );
  }

  async getTotalActiveStake() {
    const contractAddress = this.apiConfigService.getDelegationContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getTotalActiveStake',
    );
  }
}
