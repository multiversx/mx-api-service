import { ElrondCachingService } from '@multiversx/sdk-nestjs';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CacheInfo } from 'src/utils/cache.info';
import { ApiConfigService } from '../api-config/api.config.service';
import { HotSwappableSettingDbService } from '../persistence/services/hot.swappable.setting.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => HotSwappableSettingDbService))
    private readonly settingsService: HotSwappableSettingDbService,
    private readonly cachingService: ElrondCachingService,
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
        const value = await this.settingsService.getSetting<T>(name);
        if (!value) {
          await this.settingsService.setSetting(name, fallbackValue);
        }
        return value ?? fallbackValue;
      },
      CacheInfo.Setting(name).ttl,
    );
  }

  public async getAllSettings(): Promise<{ name: string, value: any }[]> {
    return await this.settingsService.getAllSettings();
  }
}
