import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query.service";

@Injectable()
export class EsdtContractService {
  constructor(
    private vmQueryService: VmQueryService,
    private apiConfigService: ApiConfigService) { }

  async getSpecialRoles(identifier: string) {
    const contractAddress = this.apiConfigService.getEsdtContractAddress();
    const hexIdentifier = BinaryUtils.stringToHex(identifier);

    return await this.vmQueryService.vmQuery(
      contractAddress,
      'getSpecialRoles',
      undefined,
      [hexIdentifier]
    );
  }
}
