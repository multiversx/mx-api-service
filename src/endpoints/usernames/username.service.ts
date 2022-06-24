import { AddressUtils, BinaryUtils, Constants, CachingService } from "@elrondnetwork/nestjs-microservice-template";
import { Injectable } from "@nestjs/common";
import { VmQueryService } from "../vm.query/vm.query.service";
import { UsernameUtils } from "./username.utils";

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

      const [encodedAddress] = await this.vmQueryService.vmQuery(contract, 'resolve', undefined, [encoded]);

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
