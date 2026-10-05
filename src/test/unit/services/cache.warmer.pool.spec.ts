import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const ttl = 10;
  const pool = [{ txHash: 'a', type: TransactionType.Transaction }];

  let warmer: CacheWarmerService;
  let poolService: any;
  let gatewayService: any;
  let cachingService: any;

  beforeEach(() => {
    jest.spyOn(Locker, 'lock').mockImplementation(async (_key: string, func: () => Promise<void>) => {
      await func();
      return LockResult.SUCCESS;
    });

    poolService = { getTxPoolRaw: jest.fn().mockResolvedValue(pool) };
    gatewayService = { getTransactionPoolCount: jest.fn().mockResolvedValue(12) };
    cachingService = { set: jest.fn() };

    warmer = Object.assign(Object.create(CacheWarmerService.prototype), {
      poolService,
      gatewayService,
      cachingService,
      apiConfigService: { getTransactionPoolCacheWarmerTtlInSeconds: () => ttl },
      clientProxy: { emit: jest.fn() },
    });
  });

  it('should warm only the pool when it can be read', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledTimes(1);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, ttl);
    expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
  });

  it('should warm the pool as null and refresh the count from the gateway when the pool is too large', async () => {
    poolService.getTxPoolRaw.mockResolvedValue(null);

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledTimes(2);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, null, ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount.key, 12, ttl);
  });
});
