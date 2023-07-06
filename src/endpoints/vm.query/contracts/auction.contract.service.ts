import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';

@Injectable()
export class AuctionContractService {
  constructor(private vmQueryService: VmQueryService) { }

  async getBlsKeysStatus(auctionContractAddress: string, publicKey: string) {
    return await this.vmQueryService.vmQuery(
      auctionContractAddress,
      'getBlsKeysStatus',
      auctionContractAddress,
      [publicKey],
    );
  }
}
