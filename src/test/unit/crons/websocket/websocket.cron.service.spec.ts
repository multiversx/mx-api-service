import { WebsocketCronService } from 'src/crons/websocket/websocket.cron.service';
import { CustomSubscriptionsRoundData } from 'src/crons/websocket/custom.subscriptions.data.fetcher';
import { CacheInfo } from 'src/utils/cache.info';

describe('WebsocketCronService', () => {
  const roundDurationMs = 600;
  const shards = 3;

  let localCache: Map<string, any>;
  let elasticService: { getList: jest.Mock };
  let dataFetcher: { fetchRoundData: jest.Mock };
  let transfersGateway: { pushTransfersForTimestampMs: jest.Mock };
  let eventsGateway: { pushEventsForTimestampMs: jest.Mock };
  let transactionsGateway: { pushTransactionsForTimestampMs: jest.Mock };
  let service: WebsocketCronService;

  const cursorKey = CacheInfo.WsTimestampMsToProcess().key;

  beforeEach(() => {
    localCache = new Map();

    const cacheService = {
      getLocal: (key: string) => localCache.get(key),
      setLocal: (key: string, value: any) => localCache.set(key, value),
      deleteLocal: (key: string) => localCache.delete(key),
    };

    const gatewayService = {
      getNetworkConfig: jest.fn().mockResolvedValue({ erd_round_duration: roundDurationMs, erd_num_shards_without_meta: shards }),
    };

    const connectionHandler = { hasSubscriptionsWithPrefixes: () => true };

    elasticService = { getList: jest.fn() };
    dataFetcher = { fetchRoundData: jest.fn().mockResolvedValue(new CustomSubscriptionsRoundData()) };
    transfersGateway = { pushTransfersForTimestampMs: jest.fn() };
    eventsGateway = { pushEventsForTimestampMs: jest.fn() };
    transactionsGateway = { pushTransactionsForTimestampMs: jest.fn() };

    service = new WebsocketCronService(
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
      cacheService as any,
      elasticService as any,
      gatewayService as any,
      transactionsGateway as any,
      eventsGateway as any,
      connectionHandler as any,
      transfersGateway as any,
      {} as any, {} as any,
      dataFetcher as any,
    );

    // every round up to the latest one is already indexed, the next one comes right after
    jest.spyOn(service as any, 'getNextIndexedRoundTimestampMs')
      .mockImplementation(async (timestampMs: any) => await Promise.resolve(timestampMs + roundDurationMs));
  });

  const mockLatestRound = (timestampMs: number) => {
    jest.spyOn(service as any, 'getLatestRoundOnChainTimestamp').mockResolvedValue({ timestampMs, timestamp: Math.floor(timestampMs / 1000) });
  };

  it('processes every round up to the latest one and keeps the next one as cursor', async () => {
    localCache.set(cursorKey, 1000);
    mockLatestRound(1000 + 2 * roundDurationMs);

    await service.handleCustomDataUpdate();

    expect(dataFetcher.fetchRoundData.mock.calls.map(call => call[0])).toEqual([1000, 1600, 2200]);
    expect(transfersGateway.pushTransfersForTimestampMs).toHaveBeenCalledTimes(3);
    expect(localCache.get(cursorKey)).toBe(2800);
  });

  it('does not move past a round whose data could not be fetched', async () => {
    localCache.set(cursorKey, 1000);
    mockLatestRound(1600);
    dataFetcher.fetchRoundData
      .mockResolvedValueOnce(new CustomSubscriptionsRoundData())
      .mockRejectedValueOnce(new Error('elastic unavailable'));

    await expect(service.handleCustomDataUpdate()).rejects.toThrow('elastic unavailable');
    expect(localCache.get(cursorKey)).toBe(1600);

    await service.handleCustomDataUpdate();
    expect(dataFetcher.fetchRoundData).toHaveBeenLastCalledWith(1600);
    expect(localCache.get(cursorKey)).toBe(2200);
  });

  it('jumps to the latest round when too far behind', async () => {
    const latest = 10_000_000;
    localCache.set(cursorKey, latest - 10 * 60 * 1000);
    mockLatestRound(latest);

    await service.handleCustomDataUpdate();

    expect(dataFetcher.fetchRoundData).toHaveBeenCalledTimes(1);
    expect(dataFetcher.fetchRoundData).toHaveBeenCalledWith(latest);
  });

  describe('getNextIndexedRoundTimestampMs', () => {
    const getNext = (timestampMs: number) => {
      (service as any).getNextIndexedRoundTimestampMs.mockRestore();
      return (service as any).getNextIndexedRoundTimestampMs(timestampMs, shards + 1);
    };

    it('returns the next round once all shards indexed it', async () => {
      elasticService.getList.mockResolvedValue([1600, 1600, 1600, 1600].map(timestampMs => ({ timestampMs })));

      expect(await getNext(1000)).toBe(1600);
    });

    it('waits while a shard did not index the next round yet', async () => {
      elasticService.getList.mockResolvedValue([1600, 1600, 1600, 2200].map(timestampMs => ({ timestampMs })));

      expect(await getNext(1000)).toBeUndefined();
    });

    it('does not assume the round duration', async () => {
      elasticService.getList.mockResolvedValue([7000, 7000, 7000, 7000].map(timestampMs => ({ timestampMs })));

      expect(await getNext(1000)).toBe(7000);
    });
  });
});
