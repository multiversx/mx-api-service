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

  async getUseVmQueryTracingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('USE_VM_QUERY_TRACING', this.apiConfigService.getUseVmQueryTracingFlag());
  }

  private async getSetting<T>(name: string, fallbackValue: T): Promise<T> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.Setting(name).key,
      async () => {
        const value = await this.persistenceService.getSetting<T>(name);
        return value ?? fallbackValue;
      },
      CacheInfo.Setting(name).ttl,
    );
  }

  public async getAllSettings(): Promise<{ name: string, value: any }[]> {
    return await this.persistenceService.getAllSettings();
  }
}
