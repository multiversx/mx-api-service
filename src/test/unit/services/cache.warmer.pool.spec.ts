import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const ttl = 10;
  const pool = [
    { txHash: 'a', type: TransactionType.Transaction },
    { txHash: 'b', type: TransactionType.Reward },
    { txHash: 'c', type: TransactionType.Reward },
  ];
  const gatewayCounts: Record<string, number | null> = {
    total: 12,
    [TransactionType.Transaction]: 12,
    [TransactionType.SmartContractResult]: null,
    [TransactionType.Reward]: null,
  };

  let warmer: CacheWarmerService;
  let poolService: any;
  let cachingService: any;

  beforeEach(() => {
    jest.spyOn(Locker, 'lock').mockImplementation(async (_key: string, func: () => Promise<void>) => {
      await func();
      return LockResult.SUCCESS;
    });

    poolService = {
      getTxPoolRaw: jest.fn().mockResolvedValue(pool),
      getPoolCountFromGateway: jest.fn().mockImplementation(async (type?: TransactionType) => await Promise.resolve(gatewayCounts[type ?? 'total'])),
    };
    cachingService = { set: jest.fn() };

    warmer = Object.assign(Object.create(CacheWarmerService.prototype), {
      poolService,
      cachingService,
      apiConfigService: { getTransactionPoolCacheWarmerTtlInSeconds: () => ttl },
      clientProxy: { emit: jest.fn() },
    });
  });

  it('should warm the pool and count the total and every type from it', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, 3, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.Transaction).key, 1, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.SmartContractResult).key, 0, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.Reward).key, 2, ttl);
    expect(poolService.getPoolCountFromGateway).not.toHaveBeenCalled();
  });

  it('should warm the pool as null and count the total and every type through the gateway when it is too large', async () => {
    poolService.getTxPoolRaw.mockResolvedValue(null);

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, null, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, gatewayCounts.total, ttl);
    for (const type of Object.values(TransactionType)) {
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(type).key, gatewayCounts[type], ttl);
    }
    expect(poolService.getPoolCountFromGateway).toHaveBeenCalledTimes(Object.values(TransactionType).length + 1);
  });
});
