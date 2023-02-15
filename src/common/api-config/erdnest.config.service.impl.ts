import { ErdnestConfigService } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";

@Injectable()
export class ErdnestConfigServiceImpl implements ErdnestConfigService {
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
