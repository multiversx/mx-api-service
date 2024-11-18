import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
import { MxnestConfigService } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class MxnestConfigServiceImpl implements MxnestConfigService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  getSecurityAdmins(): string[] {
    return this.apiConfigService.getSecurityAdmins();
  }

  getJwtSecret(): string {
    return this.apiConfigService.getJwtSecret();
  }

  getApiUrl(): string {
    return this.apiConfigService.getSelfUrl();
  }

  getNativeAuthMaxExpirySeconds(): number {
    return this.apiConfigService.getNativeAuthMaxExpirySeconds();
  }

  getNativeAuthAcceptedOrigins(): string[] {
    return this.apiConfigService.getNativeAuthAcceptedOrigins();
  }
}
