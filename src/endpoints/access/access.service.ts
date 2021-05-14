import { Injectable } from "@nestjs/common";
import Tokens from 'csrf';
import { ApiConfigService } from "src/helpers/api.config.service";

@Injectable()
export class AccessService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {}

  getAccess() {
    const expires = Math.floor(Date.now() / 1000) + 86400;

    let tokens = new Tokens();
    return tokens.create(this.apiConfigService.getCsrfSecret() + expires) + '-' + expires;
  };
}