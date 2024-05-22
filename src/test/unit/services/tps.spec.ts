import { Test } from "@nestjs/testing";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { TpsUtils } from "src/utils/tps.utils";
import { CacheInfo } from "src/utils/cache.info";
import { TpsFrequency } from "src/endpoints/tps/entities/tps.frequency";
import { TpsInterval } from "src/endpoints/tps/entities/tps.interval";
import { TpsService } from "src/endpoints/tps/tps.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";

beforeAll(() => {
  Date.prototype.getTimeInSeconds = function () {
    return Math.floor(this.getTime() / 1000);
  };
});

describe('TpsService', () => {
  let tpsService: TpsService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TpsService,
        {
          provide: CacheService,
          useValue: {
            getRemote: jest.fn(),
            getOrSet: jest.fn(),
            getManyRemote: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMetaChainShardId: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
      ],
    }).compile();

    tpsService = moduleRef.get<TpsService>(TpsService);
    cacheService = moduleRef.get<CacheService>(CacheService);
  });

  describe('getTpsLive', () => {
    it('should calculate live TPS based on the provided frequency', async () => {
      const frequency = TpsFrequency._30s;
      const frequencySeconds = TpsUtils.getFrequencyByEnum(frequency);
      const timestamp = TpsUtils.getTimestampByFrequency(Date.now() / 1000 - frequencySeconds, frequencySeconds);
      const transactions = 90;

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(transactions);

      const expectedTps = transactions / frequencySeconds;
      const result = await tpsService.getTpsLatest(frequency);
      expect(result.tps).toBe(expectedTps);
      expect(result.timestamp).toBe(timestamp);
      expect(cacheService.getRemote).toHaveBeenCalledWith(CacheInfo.TpsByTimestampAndFrequency(timestamp, frequencySeconds).key);
    });

    it('should handle errors when remote data fetch fails for live TPS', async () => {
      const frequency = TpsFrequency._30s;
      jest.spyOn(cacheService, 'getRemote').mockRejectedValue(new Error("Failed to fetch data"));

      await expect(tpsService.getTpsLatest(frequency)).rejects.toThrow("Failed to fetch data");
    });

    it('should accurately calculate TPS for a 10-minute frequency', async () => {
      const frequency = TpsFrequency._10m;
      const frequencySeconds = TpsUtils.getFrequencyByEnum(frequency);
      const timestamp = TpsUtils.getTimestampByFrequency(Date.now() / 1000 - frequencySeconds, frequencySeconds);
      const transactions = 450;

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(transactions);

      const expectedTps = transactions / frequencySeconds;
      const result = await tpsService.getTpsLatest(frequency);

      expect(result.tps).toBeCloseTo(expectedTps, 2);
      expect(result.timestamp).toBe(timestamp);
      expect(cacheService.getRemote).toHaveBeenCalledWith(CacheInfo.TpsByTimestampAndFrequency(timestamp, frequencySeconds).key);
    });

    it('should efficiently calculate TPS for very high transaction volumes', async () => {
      const frequency = TpsFrequency._30s;
      const frequencySeconds = TpsUtils.getFrequencyByEnum(frequency);
      const timestamp = TpsUtils.getTimestampByFrequency(Date.now() / 1000 - frequencySeconds, frequencySeconds);
      const veryHighTransactions = 1000000;

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(veryHighTransactions);

      const startTime = performance.now();
      const result = await tpsService.getTpsLatest(frequency);
      const endTime = performance.now();
      const expectedTps = veryHighTransactions / frequencySeconds;

      expect(result.tps).toBe(expectedTps);
      expect(result.timestamp).toBe(timestamp);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should remain stable and not throw errors under extreme load', async () => {
      const frequency = TpsFrequency._10m;
      const frequencySeconds = TpsUtils.getFrequencyByEnum(frequency);
      const timestamp = TpsUtils.getTimestampByFrequency(Date.now() / 1000 - frequencySeconds, frequencySeconds);
      const extremeTransactions = 5000000;

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(extremeTransactions);

      await expect(tpsService.getTpsLatest(frequency)).resolves.toEqual(expect.objectContaining({
        tps: extremeTransactions / frequencySeconds,
        timestamp: timestamp,
      }));
    });

    it('should handle situations with no transaction data available', async () => {
      const frequency = TpsFrequency._10m;
      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(null);

      const result = await tpsService.getTpsLatest(frequency);

      expect(result.tps).toBe(0);
    });
  });

  describe('getTpsHistory', () => {
    it('should retrieve a history of TPS based on the specified interval', async () => {
      const interval = TpsInterval._1h;
      const frequencySeconds = TpsUtils.getFrequencyByInterval(interval);
      const endTimestamp = TpsUtils.getTimestampByFrequency(Date.now() / 1000, frequencySeconds);
      const startTimestamp = endTimestamp - TpsUtils.getIntervalByEnum(interval);

      const timestamps = Array.from({ length: (endTimestamp - startTimestamp) / frequencySeconds + 1 }, (_, i) => startTimestamp + i * frequencySeconds);
      const transactionResults = new Array(timestamps.length).fill(120);

      jest.spyOn(cacheService, 'getManyRemote').mockResolvedValue(transactionResults);
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, func) => await func());

      const results = await tpsService.getTpsHistory(interval);
      expect(results.length).toBe(timestamps.length);
      results.forEach((result, index) => {
        expect(result.timestamp).toBe(timestamps[index]);
        expect(result.tps).toBe(transactionResults[index] / frequencySeconds);
      });
      expect(cacheService.getManyRemote).toHaveBeenCalled();
    });
  });
});
