import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const ttl = 10;
  const totalCount = 12;
  const pool = [
    { txHash: 'a', type: TransactionType.Transaction },
    { txHash: 'b', type: TransactionType.Reward },
    { txHash: 'c', type: TransactionType.Reward },
  ];
  const typeCounts: Record<TransactionType, number> = {
    [TransactionType.Transaction]: 1,
    [TransactionType.SmartContractResult]: 0,
    [TransactionType.Reward]: 2,
  };

  let warmer: CacheWarmerService;
  let poolService: any;
  let cachingService: any;

  beforeEach(() => {
    // run the handler without the lock around it, which records metrics and swallows the errors
    jest.spyOn(Locker, 'lock').mockImplementation(async (_key: string, func: () => Promise<void>) => {
      await func();
      return LockResult.SUCCESS;
    });

    poolService = {
      getPoolCountRaw: jest.fn().mockResolvedValue(totalCount),
      getTxPoolRaw: jest.fn().mockResolvedValue(pool),
    };
    cachingService = { set: jest.fn() };

    // only the dependencies of the pool warming, without the constructor, which also schedules every cron
    warmer = Object.assign(Object.create(CacheWarmerService.prototype), {
      poolService,
      cachingService,
      apiConfigService: { getTransactionPoolCacheWarmerTtlInSeconds: () => ttl },
      clientProxy: { emit: jest.fn() },
    });
  });

  it('should warm the pool, its total count and the count for every transaction type, counted from that pool', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, totalCount, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, ttl);
    for (const type of Object.values(TransactionType)) {
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(type).key, typeCounts[type], ttl);
    }
    expect(poolService.getPoolCountRaw).toHaveBeenCalledTimes(1);
  });

  it('should request the total count and the pool together', async () => {
    let releaseCount: () => void = () => { };
    poolService.getPoolCountRaw.mockImplementationOnce(async () => await new Promise<number>(resolve => releaseCount = () => resolve(totalCount)));

    const warming = warmer.handleTxPoolInvalidations();
    await new Promise(resolve => setImmediate(resolve));

    // the pool was requested while the total count is still pending
    expect(poolService.getTxPoolRaw).toHaveBeenCalled();

    releaseCount();
    await warming;
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, totalCount, ttl);
  });

  it('should cache the pool as null, besides the total count, while it is too large', async () => {
    poolService.getTxPoolRaw.mockResolvedValue(null);

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledTimes(2);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, totalCount, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, null, ttl);
    expect(poolService.getPoolCountRaw).toHaveBeenCalledTimes(1);
  });
});
