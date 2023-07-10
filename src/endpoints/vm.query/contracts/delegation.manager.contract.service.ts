import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query.service";

@Injectable()
export class DelegationManagerContractService {
  private contractAddress: string;

  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) {
    this.contractAddress = this.apiConfigService.getDelegationManagerContractAddress();
  }

  async getContractConfig() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getContractConfig'
    );
  }

  async getAllContractAddresses() {
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getAllContractAddresses'
    );
  }
}
