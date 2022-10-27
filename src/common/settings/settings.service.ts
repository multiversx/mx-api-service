import { CachingService } from '@elrondnetwork/erdnest';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CacheInfo } from 'src/utils/cache.info';
import { ApiConfigService } from '../api-config/api.config.service';
import { PersistenceService } from '../persistence/persistence.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService
  ) { }

  async getUseRequestCachingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_REQUEST_CACHING', this.apiConfigService.getUseRequestCachingFlag());
  }

  async getUseRequestLoggingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_REQUEST_LOGGING', this.apiConfigService.getUseRequestLoggingFlag());
  }

  async getUseKeepAliveAgentFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_KEEP_ALIVE_AGENT', this.apiConfigService.getUseKeepAliveAgentFlag());
  }

  async getUseTracingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_TRACING', this.apiConfigService.getUseTracingFlag());
  }

  async getUseVmQueryTracingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_VM_QUERY_TRACING', this.apiConfigService.getUseVmQueryTracingFlag());
  }

  async getIsProcessNftsFlagActive(): Promise<boolean> {
    return await this.getSetting<boolean>('PROCESS_NFTS', this.apiConfigService.getIsProcessNftsFlagActive());
  }

  async getIsIndexerV3FlagActive(): Promise<boolean> {
    return await this.getSetting<boolean>('INDEXER_V3', this.apiConfigService.getIsIndexerV3FlagActive());
  }

  async isStakingV4Enabled(): Promise<boolean> {
    return await this.getSetting<boolean>('STAKING_V4', this.apiConfigService.isStakingV4Enabled());
  }

  private async getSetting<T>(name: string, fallbackValue: T): Promise<T> {
    const settingCache = await this.cachingService.getCache<T>(CacheInfo.Setting(name).key);
    if (settingCache) {
      return settingCache;
    }

    const settingDb = await this.persistenceService.getSetting<T>(name);
    if (settingDb) {
      await this.cachingService.setCache(CacheInfo.Setting(name).key, settingDb, CacheInfo.Setting(name).ttl);
      return settingDb;
    }

    return fallbackValue;
  }
}
