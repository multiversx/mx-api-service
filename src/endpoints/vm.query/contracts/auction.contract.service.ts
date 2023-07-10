import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AddressUtils } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class AuctionContractService {
  private contractAddress: string;
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) {
    this.contractAddress = this.apiConfigService.getAuctionContractAddress();
  }

  async getBlsKeysStatus(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getBlsKeysStatus',
      this.contractAddress,
      [publicKey],
    );
  }

  async getTotalStaked(address: string) {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getTotalStaked',
      address,
    );
  }

  async getUnStakedTokensList(address: string) {
    const hexAddress = AddressUtils.bech32Decode(address);

    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getUnStakedTokensList',
      address,
      [hexAddress]
    );
  }

  async getTotalStakedTopUpStakedBlsKeys(address: string) {
    const hexAddress = AddressUtils.bech32Decode(address);

    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getTotalStakedTopUpStakedBlsKeys',
      this.contractAddress,
      [hexAddress]
    );
  }
}
