import { NestjsApiConfigService } from "@elrondnetwork/nestjs-microservice-common";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";

@Injectable()
export class NestJsApiConfigServiceImpl implements NestjsApiConfigService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  getSecurityAdmins(): string[] {
    return this.apiConfigService.getSecurityAdmins();
  }

  getJwtSecret(): string {
    return this.apiConfigService.getJwtSecret();
  }

  getAccessAddress(): string {
    return this.apiConfigService.getAccessAddress();
  }

}
