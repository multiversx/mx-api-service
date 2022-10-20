import { Constants, CachingService, ApiService, OriginLogger, BinaryUtils, AddressUtils } from "@elrondnetwork/erdnest";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { UsernameUtils } from "./username.utils";

@Injectable()
export class UsernameService {
  private readonly logger = new OriginLogger(UsernameService.name);

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
    private readonly vmQueryService: VmQueryService
  ) { }

  async getUsernameForAddressRaw(address: string): Promise<string | null> {
    try {
      // eslint-disable-next-line require-await
      const result = await this.apiService.get(`${this.apiConfigService.getMaiarIdUrl()}/users/api/v1/users/${address}`, undefined, async error => error?.response?.status === HttpStatus.FORBIDDEN);

      const username = result?.data?.herotag;

      return username ?? null;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting username for address '${address}'`);
      return null;
    }
  }

  private async getAddressForUsernameRaw(username: string): Promise<string | null> {
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

  async getAddressForUsername(username: string): Promise<string | null> {
    const address = await this.cachingService.getOrSetCache(
      UsernameUtils.normalizeUsername(username),
      async () => await this.getAddressForUsernameRaw(username),
      Constants.oneWeek()
    );

    if (!address) {
      return null;
    }

    const crossCheckUsername = await this.getUsernameForAddressRaw(address);
    if (!crossCheckUsername) {
      return null;
    }

    return address;
  }
}
