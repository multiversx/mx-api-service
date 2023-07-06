import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query.service";

@Injectable()
export class DelegationManagerContractService {
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) { }

  async getContractConfig() {
    const contractAddress = this.apiConfigService.getDelegationManagerContractAddress();

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getContractConfig'
    );
  }
}
