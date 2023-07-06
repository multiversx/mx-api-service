import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';

@Injectable()
export class DelegationContractService {
  constructor(private vmQueryService: VmQueryService) { }

  async getUserDeferredPaymentList(delegationContractAddress: string, publicKey: string) {
    return await this.vmQueryService.vmQuery(
      delegationContractAddress,
      'getUserDeferredPaymentList',
      undefined,
      [publicKey]
    );
  }

  async getNumBlocksBeforeUnBond(delegationContractAddress: string) {
    return await this.vmQueryService.vmQuery(
      delegationContractAddress,
      'getNumBlocksBeforeUnBond'
    );
  }
}
