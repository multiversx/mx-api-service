import { Injectable } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { AddressUtils } from "src/utils/address.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { UsernameUtils } from "src/utils/username.utils";
import { VmQueryService } from "../vm.query/vm.query.service";

@Injectable()
export class UsernameService {
  constructor(
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
  ) { }

  private async getUsernameAddress(username: string): Promise<string | null> {
    try {
      const contract = UsernameUtils.getContractAddress(username);
      const encoded = UsernameUtils.encodeUsername(username);

      const [encodedAddress] = await this.vmQueryService.vmQuery(contract, 'resolve', undefined, undefined, [encoded]);

      if (encodedAddress) {
        const publicKey = BinaryUtils.base64ToHex(encodedAddress);
        return AddressUtils.bech32Encode(publicKey);
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  async getUsernameAddressRaw(username: string): Promise<string | null> {
    return await this.cachingService.getOrSetCache(
      UsernameUtils.normalizeUsername(username),
      async () => await this.getUsernameAddress(username),
      Constants.oneWeek()
    );
  }
}
