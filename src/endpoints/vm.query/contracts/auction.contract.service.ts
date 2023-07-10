import { Injectable } from '@nestjs/common';
import { VmQueryService } from '../vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AddressUtils } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class AuctionContractService {
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) { }

  async getBlsKeysStatus(publicKey: string) {
    const contractAddress = this.apiConfigService.getAuctionContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getBlsKeysStatus',
      contractAddress,
      [publicKey],
    );
  }

  async getTotalStaked(address: string) {
    const contractAddress = this.apiConfigService.getAuctionContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getTotalStaked',
      address,
    );
  }

  async getUnStakedTokensList(address: string) {
    const contractAddress = this.apiConfigService.getAuctionContractAddress();
    const hexAddress = AddressUtils.bech32Decode(address);

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getUnStakedTokensList',
      address,
      [hexAddress]
    );
  }

  async getTotalStakedTopUpStakedBlsKeys(address: string) {
    const contractAddress = this.apiConfigService.getAuctionContractAddress();
    const hexAddress = AddressUtils.bech32Decode(address);

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getTotalStakedTopUpStakedBlsKeys',
      contractAddress,
      [hexAddress]
    );
  }
}
