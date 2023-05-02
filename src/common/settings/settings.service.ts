import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CacheInfo } from 'src/utils/cache.info';
import { ApiConfigService } from '../api-config/api.config.service';
import { PersistenceService } from '../persistence/persistence.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => PersistenceService))
    private readonly persistenceService: PersistenceService,
    private readonly cachingService: CacheService,
  ) { }

  async getUseRequestCachingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('UseRequestCaching', this.apiConfigService.getUseRequestCachingFlag());
  }

  async getUseRequestLoggingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('UseRequestLogging', this.apiConfigService.getUseRequestLoggingFlag());
  }

  async getUseVmQueryTracingFlag(): Promise<boolean> {
    return await this.getSetting<boolean>('UseVmQueryTracing', this.apiConfigService.getUseVmQueryTracingFlag());
  }

  private async getSetting<T>(name: string, fallbackValue: T): Promise<T> {
    return await this.cachingService.getOrSet(
      CacheInfo.Setting(name).key,
      async () => {
        const value = await this.persistenceService.getSetting<T>(name);
        if (!value) {
          await this.persistenceService.setSetting(name, fallbackValue);
        }
        return value ?? fallbackValue;
      },
      CacheInfo.Setting(name).ttl,
    );
  }

  public async getAllSettings(): Promise<{ name: string, value: any }[]> {
    return await this.persistenceService.getAllSettings();
  }
}
