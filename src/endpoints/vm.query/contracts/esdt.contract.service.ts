import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query.service";

@Injectable()
export class EsdtContractService {
  private contractAddress: string;

  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) {
    this.contractAddress = this.apiConfigService.getEsdtContractAddress();
  }

  async getSpecialRoles(identifier: string) {
    const hexIdentifier = BinaryUtils.stringToHex(identifier);
    return await this.vmQueryService.vmQuery(
      this.contractAddress,
      'getSpecialRoles',
      undefined,
      [hexIdentifier]
    );
  }
}
