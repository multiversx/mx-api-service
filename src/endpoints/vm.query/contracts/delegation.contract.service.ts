import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class DelegationContractService {
  private contractAddress: string;

  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) {
    this.contractAddress = this.apiConfigService.getDelegationContractAddress();
  }

  async getUserDeferredPaymentList(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getUserDeferredPaymentList',
      undefined,
      [publicKey]
    );
  }

  async getNumBlocksBeforeUnBond() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getNumBlocksBeforeUnBond'
    );
  }

  async getTotalStakeByType() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getTotalStakeByType',
    );
  }

  async getNumUsers() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getNumUsers',
    );
  }

  async getUserStakeByType(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getUserStakeByType',
      undefined,
      [publicKey]
    );
  }

  async getClaimableRewards(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getClaimableRewards',
      undefined,
      [publicKey]
    );
  }

  async getTotalActiveStake() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getTotalActiveStake',
    );
  }

  async getFullWaitingList() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getFullWaitingList',
    );
  }

  async getAllNodeStates(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      publicKey,
      'getAllNodeStates'
    );
  }
}
