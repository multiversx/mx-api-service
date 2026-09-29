import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionPoolTooLargeException } from "src/endpoints/pool/entities/transaction.pool.too.large.exception";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const ttl = 10;
  const pool = [{ txHash: 'a', type: TransactionType.Transaction }];
  const counts: Record<string, number> = {
    total: 12,
    [TransactionType.Transaction]: 3,
    [TransactionType.SmartContractResult]: 4,
    [TransactionType.Reward]: 5,
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
      getPoolCountRaw: jest.fn().mockImplementation(async (type?: TransactionType) => await Promise.resolve(counts[type ?? 'total'])),
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

  it('should warm the pool, its total count and the count for every transaction type', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, counts.total, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, ttl);
    for (const type of Object.values(TransactionType)) {
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(type).key, counts[type], ttl);
    }
  });

  it('should warm only the total count while the pool is too large', async () => {
    poolService.getTxPoolRaw.mockRejectedValue(new TransactionPoolTooLargeException());

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledTimes(1);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, counts.total, ttl);
  });
});
