import { Injectable } from '@nestjs/common';
import { ApiConfigService } from '../api-config/api.config.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  // eslint-disable-next-line require-await
  async getUseRequestCachingFlag(): Promise<boolean> {
    return this.apiConfigService.getUseRequestCachingFlag();
  }

  // eslint-disable-next-line require-await
  async getUseRequestLoggingFlag(): Promise<boolean> {
    return this.apiConfigService.getUseRequestLoggingFlag();
  }

  // eslint-disable-next-line require-await
  async getUseKeepAliveAgentFlag(): Promise<boolean> {
    return this.apiConfigService.getUseKeepAliveAgentFlag();
  }

  // eslint-disable-next-line require-await
  async getUseTracingFlag(): Promise<boolean> {
    return this.apiConfigService.getUseTracingFlag();
  }

  // eslint-disable-next-line require-await
  async getUseVmQueryTracingFlag(): Promise<boolean> {
    return this.apiConfigService.getUseVmQueryTracingFlag();
  }

  // eslint-disable-next-line require-await
  async getIsProcessNftsFlagActive(): Promise<boolean> {
    return this.apiConfigService.getIsProcessNftsFlagActive();
  }

  // eslint-disable-next-line require-await
  async getIsIndexerV3FlagActive(): Promise<boolean> {
    return this.apiConfigService.getIsIndexerV3FlagActive();
  }

  // eslint-disable-next-line require-await
  async isStakingV4Enabled(): Promise<boolean> {
    return this.apiConfigService.isStakingV4Enabled();
  }
}
