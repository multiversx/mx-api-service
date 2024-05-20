import { Injectable } from "@nestjs/common";
import { TpsFrequency } from "./entities/tps.frequency";
import { TpsUtils } from "src/utils/tps.utils";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { Tps } from "./entities/tps";
import { TpsInterval } from "./entities/tps.interval";

@Injectable()
export class TpsService {
  constructor(
    private readonly cacheService: CacheService,
  ) { }

  async getTpsLatest(frequency: TpsFrequency): Promise<Tps> {
    const frequencySeconds = TpsUtils.getFrequencyByEnum(frequency);
    const timestamp = TpsUtils.getTimestampByFrequency(new Date().getTimeInSeconds() - frequencySeconds, frequencySeconds);

    const transactionCount = (await this.cacheService.getRemote<number>(CacheInfo.TpsByTimestampAndFrequency(timestamp, frequencySeconds).key)) ?? 0;

    const tps = transactionCount / frequencySeconds;

    return new Tps({ timestamp, tps });
  }

  async getTpsHistory(interval: TpsInterval): Promise<Tps[]> {
    return await this.cacheService.getOrSet<Tps[]>(
      CacheInfo.TpsHistoryByInterval(interval).key,
      async () => await this.getTpsHistoryRaw(interval),
      CacheInfo.TpsHistoryByInterval(interval).ttl
    );
  }

  async getTpsHistoryRaw(interval: TpsInterval): Promise<Tps[]> {
    const frequencySeconds = TpsUtils.getFrequencyByInterval(interval);
    const endTimestamp = TpsUtils.getTimestampByFrequency(new Date().getTimeInSeconds(), frequencySeconds);
    const startTimestamp = endTimestamp - TpsUtils.getIntervalByEnum(interval);

    const timestamps = [];
    for (let timestamp = startTimestamp; timestamp <= endTimestamp; timestamp += frequencySeconds) {
      timestamps.push(timestamp);
    }

    const keys = timestamps.map(timestamp => CacheInfo.TpsByTimestampAndFrequency(timestamp, frequencySeconds).key);

    const transactionResults = await this.cacheService.getManyRemote<number>(keys);

    return timestamps.zip(transactionResults, (timestamp, transactions) => new Tps({ timestamp, tps: (transactions ?? 0) / frequencySeconds }));
  }


}
