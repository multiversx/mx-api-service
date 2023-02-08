import { ErrorLoggerAsync, PassthroughAsync } from "@multiversx/sdk-nestjs";
import { Repository } from "typeorm";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { HotSwappableSettingDb } from "../entities/hot.swappable.setting";
import { InjectRepository } from "@nestjs/typeorm";
import { isPassThrough, PersistenceService } from "../persistence.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class HotSwappableSettingDbService extends PersistenceService {
  constructor(
    @InjectRepository(HotSwappableSettingDb)
    private readonly settingsRepository: Repository<HotSwappableSettingDb>) {
    super();
  }


  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getSetting')
  @ErrorLoggerAsync({ logArgs: true })
  async getSetting<T>(name: string): Promise<T | undefined> {
    const setting = await this.settingsRepository.findOne({ where: { name } });
    if (!setting) {
      return undefined;
    }

    return JSON.parse(setting.value) as T;
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'setSetting')
  @ErrorLoggerAsync({ logArgs: true })
  async setSetting<T>(name: string, value: T): Promise<void> {
    let item = await this.settingsRepository.findOne({ where: { name } });
    if (!item) {
      item = new HotSwappableSettingDb();
    }

    item.name = name;
    item.value = value;

    await this.save(this.settingsRepository, item);
  }

  @PassthroughAsync(isPassThrough, null)
  @LogPerformanceAsync(MetricsEvents.SetPersistenceDuration, 'getAllSettings')
  @ErrorLoggerAsync({ logArgs: true })
  async getAllSettings(): Promise<{ name: string, value: any }[]> {
    const settings = await this.settingsRepository.find();
    return settings.map(setting => ({
      name: setting.name,
      value: setting.value,
    }));
  }
}
