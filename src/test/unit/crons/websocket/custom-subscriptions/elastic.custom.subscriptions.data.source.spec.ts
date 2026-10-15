import { ElasticCustomSubscriptionsDataSource } from 'src/crons/websocket/custom-subscriptions/elastic/elastic.custom.subscriptions.data.source';
import { IndexerRound } from 'src/crons/websocket/custom-subscriptions/entities';
import { CacheInfo } from 'src/utils/cache.info';

describe('ElasticCustomSubscriptionsDataSource', () => {
  const roundDurationMs = 600;
  const shards = 3;
  const cursorKey = CacheInfo.WsTimestampMsToProcess().key;

  let localCache: Map<string, any>;
  let getTransfers: jest.Mock;
  let getEvents: jest.Mock;
  let broadcaster: { hasSubscriptions: jest.Mock; broadcast: jest.Mock };
  let dataSource: ElasticCustomSubscriptionsDataSource;

  beforeEach(() => {
    localCache = new Map();

    const cacheService = {
      getOrSetLocal: async (key: string, createValueFunc: () => Promise<number>) => {
        if (!localCache.has(key)) {
          localCache.set(key, await createValueFunc());
        }

        return localCache.get(key);
      },
      setLocal: (key: string, value: any) => localCache.set(key, value),
      deleteLocal: (key: string) => localCache.delete(key),
    };

    const gatewayService = {
      getNetworkConfig: jest.fn().mockResolvedValue({ erd_round_duration: roundDurationMs, erd_num_shards_without_meta: shards }),
    };

    getTransfers = jest.fn().mockResolvedValue([]);
    getEvents = jest.fn().mockResolvedValue([]);
    broadcaster = { hasSubscriptions: jest.fn().mockReturnValue(true), broadcast: jest.fn() };

    dataSource = new ElasticCustomSubscriptionsDataSource(
      broadcaster as any,
      { getTransfers, getEvents } as any,
      {} as any,
      gatewayService as any,
      cacheService as any,
    );

    jest.spyOn(dataSource as any, 'isElasticDataAvailableForTimestampMs').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockLatestRound = (timestampMs: number) => {
    jest.spyOn(dataSource as any, 'getLatestRoundOnChainTimestampMs').mockResolvedValue(timestampMs);
  };

  const broadcastTimestamps = () => broadcaster.broadcast.mock.calls.map(([round]: [IndexerRound]) => round.timestampMs);

  describe('processNextRound', () => {
    it('broadcasts the round at the cursor and moves the cursor to the next round', async () => {
      localCache.set(cursorKey, 1000);

      await dataSource.processNextRound();
      await dataSource.processNextRound();

      expect(broadcastTimestamps()).toEqual([1000, 1600]);
      expect(localCache.get(cursorKey)).toBe(2200);
    });

    it('starts from the latest round when there is no cursor', async () => {
      mockLatestRound(10_000_000);

      await dataSource.processNextRound();

      expect(broadcastTimestamps()).toEqual([10_000_000]);
      expect(localCache.get(cursorKey)).toBe(10_000_600);
    });

    it('sleeps until the next round starts before polling for the data', async () => {
      jest.useFakeTimers({ now: 1_000_200 });
      localCache.set(cursorKey, 1_000_000);
      const isElasticDataAvailable = jest.spyOn(dataSource as any, 'isElasticDataAvailableForTimestampMs');

      const processing = dataSource.processNextRound();
      await jest.advanceTimersByTimeAsync(399);

      expect(isElasticDataAvailable).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      await processing;

      expect(isElasticDataAvailable).toHaveBeenCalledTimes(1);
      expect(broadcastTimestamps()).toEqual([1_000_000]);
    });

    it('polls right away when the next round already started', async () => {
      localCache.set(cursorKey, 1000);
      const isElasticDataAvailable = jest.spyOn(dataSource as any, 'isElasticDataAvailableForTimestampMs');

      await dataSource.processNextRound();

      expect(isElasticDataAvailable).toHaveBeenCalledTimes(1);
    });

    it('keeps the cursor when the round does not become available while polling', async () => {
      jest.useFakeTimers();
      localCache.set(cursorKey, 1000);
      jest.spyOn(dataSource as any, 'isElasticDataAvailableForTimestampMs').mockResolvedValue(false);

      const processing = dataSource.processNextRound();
      await jest.runAllTimersAsync();
      await processing;

      expect(broadcaster.broadcast).not.toHaveBeenCalled();
      expect(localCache.get(cursorKey)).toBe(1000);
    });

    it('resets the cursor and fetches nothing when there are no subscriptions', async () => {
      jest.useFakeTimers();
      localCache.set(cursorKey, 1000);
      broadcaster.hasSubscriptions.mockReturnValue(false);

      const processing = dataSource.processNextRound();
      await jest.runAllTimersAsync();
      await processing;

      expect(localCache.has(cursorKey)).toBe(false);
      expect(getTransfers).not.toHaveBeenCalled();
      expect(broadcaster.broadcast).not.toHaveBeenCalled();
    });
  });

  describe('fetchRoundDataRaw', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('returns the indexer documents of the round', async () => {
      getTransfers.mockResolvedValue([{ txHash: 'a' }]);
      getEvents.mockResolvedValue([{ _id: 'e' }]);

      const roundDataRaw = await dataSource.fetchRoundDataRaw(1000);

      expect(roundDataRaw).toEqual(new IndexerRound({ timestampMs: 1000, operations: [{ txHash: 'a' } as any], events: [{ _id: 'e' } as any] }));
    });

    it('fetches the next batches using the cursor of the last document', async () => {
      const firstBatch = Array.from({ length: 10000 }, (_, index) => ({ txHash: `${index}`, searchAfter: `cursor-${index}` }));
      getTransfers
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce([{ txHash: 'last' }]);

      const roundDataRaw = await dataSource.fetchRoundDataRaw(1000);

      expect(getTransfers.mock.calls[1][1].searchAfter).toBe('cursor-9999');
      expect(roundDataRaw.operations).toHaveLength(10001);
    });

    it('retries a failed fetch until it succeeds', async () => {
      getTransfers
        .mockRejectedValueOnce(new Error('elastic unavailable'))
        .mockRejectedValueOnce(new Error('elastic unavailable'))
        .mockResolvedValueOnce([{ txHash: 'a' }]);

      const roundDataRawPromise = dataSource.fetchRoundDataRaw(1000);
      await jest.runAllTimersAsync();
      const roundDataRaw = await roundDataRawPromise;

      expect(getTransfers).toHaveBeenCalledTimes(3);
      expect(roundDataRaw.operations).toHaveLength(1);
    });

    it('goes on without the data after 3 retries', async () => {
      getTransfers.mockRejectedValue(new Error('elastic unavailable'));
      getEvents.mockResolvedValue([{ _id: 'e' }]);

      const roundDataRawPromise = dataSource.fetchRoundDataRaw(1000);
      await jest.runAllTimersAsync();
      const roundDataRaw = await roundDataRawPromise;

      expect(getTransfers).toHaveBeenCalledTimes(4);
      expect(roundDataRaw.operations).toEqual([]);
      expect(roundDataRaw.events).toHaveLength(1);
    });

    it('does not fetch again what already succeeded', async () => {
      getEvents.mockRejectedValueOnce(new Error('elastic unavailable'));

      const roundDataRawPromise = dataSource.fetchRoundDataRaw(1000);
      await jest.runAllTimersAsync();
      await roundDataRawPromise;

      expect(getTransfers).toHaveBeenCalledTimes(1);
      expect(getEvents).toHaveBeenCalledTimes(2);
    });
  });
});
