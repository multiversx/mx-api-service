import { Locker, LockResult } from "@multiversx/sdk-nestjs-common";
import { CacheWarmerService } from "src/crons/cache.warmer/cache.warmer.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { CacheInfo } from "src/utils/cache.info";

describe('CacheWarmerService transaction pool', () => {
  const pool = [
    { txHash: 'a', type: TransactionType.Transaction },
    { txHash: 'b', type: TransactionType.Reward },
    { txHash: 'c', type: TransactionType.Reward },
  ];
  const gatewayCounts: Record<string, number> = {
    total: 12,
    [TransactionType.Transaction]: 7,
    [TransactionType.SmartContractResult]: 3,
    [TransactionType.Reward]: 2,
  };

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
    gatewayService = {
      getTransactionPoolCount: jest.fn().mockImplementation(async (type?: TransactionType) => await Promise.resolve(gatewayCounts[type ?? 'total'])),
    };
    cachingService = { set: jest.fn() };

    warmer = Object.assign(Object.create(CacheWarmerService.prototype), {
      poolService,
      gatewayService,
      cachingService,
      clientProxy: { emit: jest.fn() },
    });
  });

  it('should warm the pool and count the total and every type from it', async () => {
    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, pool, CacheInfo.TransactionPool.ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, 3, CacheInfo.TransactionPoolCount().ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.Transaction).key, 1, CacheInfo.TransactionPoolCount(TransactionType.Transaction).ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.SmartContractResult).key, 0, CacheInfo.TransactionPoolCount(TransactionType.SmartContractResult).ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.Reward).key, 2, CacheInfo.TransactionPoolCount(TransactionType.Reward).ttl);
    expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
  });

  it('should warm the pool as null and count the total and every type through the gateway when it is too large', async () => {
    poolService.getTxPoolRaw.mockResolvedValue(null);

    await warmer.handleTxPoolInvalidations();

    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, null, CacheInfo.TransactionPool.ttl);
    expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, gatewayCounts.total, CacheInfo.TransactionPoolCount().ttl);
    for (const type of Object.values(TransactionType)) {
      expect(cachingService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(type).key, gatewayCounts[type], CacheInfo.TransactionPoolCount(type).ttl);
    }
    expect(gatewayService.getTransactionPoolCount).toHaveBeenCalledTimes(Object.values(TransactionType).length + 1);
  });
});
