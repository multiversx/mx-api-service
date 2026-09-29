import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const ttl = 10;
  const gatewayCount = 12;
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
  let gatewayService: any;
  let cachingService: any;

  beforeEach(() => {
    // run the handler without the lock around it, which records metrics and swallows the errors
    jest.spyOn(Locker, 'lock').mockImplementation(async (_key: string, func: () => Promise<void>) => {
      await func();
      return LockResult.SUCCESS;
    });

    poolService = { getTxPoolRaw: jest.fn().mockResolvedValue(pool) };
    gatewayService = { getTransactionPoolCount: jest.fn().mockResolvedValue(gatewayCount) };
    cachingService = { set: jest.fn() };

    // only the dependencies of the pool warming, without the constructor, which also schedules every cron
    warmer = Object.assign(Object.create(CacheWarmerService.prototype), {
      poolService,
      gatewayService,
      cachingService,
      apiConfigService: { getTransactionPoolCacheWarmerTtlInSeconds: () => ttl },
      clientProxy: { emit: jest.fn() },
    });
  });

  it('should warm the pool, and count the total and every transaction type from that pool', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, pool.length, ttl);
    for (const type of Object.values(TransactionType)) {
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(type).key, typeCounts[type], ttl);
    }
    expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
  });

  it('should cache the pool as null and take the total from the gateway while the pool is too large', async () => {
    poolService.getTxPoolRaw.mockResolvedValue(null);

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledTimes(2);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, null, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, gatewayCount, ttl);
    expect(gatewayService.getTransactionPoolCount).toHaveBeenCalledTimes(1);
  });
});
