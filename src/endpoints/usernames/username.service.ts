import { Constants, OriginLogger, BinaryUtils, AddressUtils } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { VmQueryService } from "../vm.query/vm.query.service";
import { UsernameUtils } from "./username.utils";

@Injectable()
export class UsernameService {
  private readonly logger = new OriginLogger(UsernameService.name);

  constructor(
    private readonly cachingService: CacheService,
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

  async getUsernameForAddress(address: string): Promise<string | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.Username(address).key,
      async () => await this.getUsernameForAddressRaw(address),
      CacheInfo.Username(address).ttl,
    );
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
    const address = await this.cachingService.getOrSet(
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

  getUsernameRedirectRoute(address: string, withGuardianInfo: boolean | undefined) {
    const params: {} = {
      withGuardianInfo,
    };

    const paramArray = [];

    for (const [key, value] of Object.entries(params)) {
      if (value) {
        paramArray.push(`${key}=${value}`);
      }
    }

    let route = `/accounts/${address}`;
    if (paramArray.length > 0) {
      route += '?' + paramArray.join('&');
    }

    return route;
  }
}
