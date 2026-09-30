import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { PoolService } from "src/endpoints/pool/pool.service";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { ProtocolService } from "../../../common/protocol/protocol.service";
import { TransactionActionService } from "../../../endpoints/transactions/transaction-action/transaction.action.service";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionPoolTooLargeException } from "src/endpoints/pool/entities/transaction.pool.too.large.exception";

describe('PoolService', () => {
  let service: PoolService;
  let gatewayService: GatewayService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PoolService,
        {
          provide: GatewayService,
          useValue: {
            getTransactionPool: jest.fn(),
            getTransactionPoolCount: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            isTransactionPoolEnabled: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TransactionActionService,
          useValue: {
            getTransactionMetadata: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<PoolService>(PoolService);
    gatewayService = moduleRef.get<GatewayService>(GatewayService);
    cacheService = moduleRef.get<CacheService>(CacheService);

    const data = require('../../mocks/pool.mock.json');

    gatewayService.getTransactionPool = jest.fn().mockResolvedValue(data);
    const txPoolRaw = await service.getTxPoolRaw();

    cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
      return key === CacheInfo.TransactionPool.key ? txPoolRaw : await createValueFunc();
    });

  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPool', () => {
    it('should work and return the pool', async () => {
      const pool = await service.getPool(new QueryPagination(), new PoolFilter());
      expect(pool).toHaveLength(7);
      expect(pool?.[0].type).toStrictEqual(TransactionType.Transaction);
    });

    it('should work and return the pool with filters', async () => {
      let pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.Transaction }));
      expect(pool).toHaveLength(1);

      pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.SmartContractResult }));
      expect(pool).toHaveLength(1);

      pool = await service.getPool(new QueryPagination(), new PoolFilter({ type: TransactionType.Reward }));
      expect(pool).toHaveLength(5);
    });

    it('should work and return the pool with query pagination', async () => {
      const pool = await service.getPool(new QueryPagination({ from: 0, size: 2 }), new PoolFilter({ type: TransactionType.Reward }));
      expect(pool).toHaveLength(2);
      expect(pool?.[0].type).toStrictEqual(TransactionType.Reward);
    });
  });

  describe('getPoolCount', () => {
    it('should count the total from the pool, so that it matches what the pool lists', async () => {
      gatewayService.getTransactionPoolCount = jest.fn();

      expect(await service.getPoolCount(new PoolFilter())).toStrictEqual(7);
      expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
    });

    it('should count the pool, without caching the count, for filters', async () => {
      const filter = new PoolFilter({ type: TransactionType.Transaction, senderShard: 0 });

      const poolCount = await service.getPoolCount(filter);
      expect(cacheService.getOrSet).toHaveBeenCalledTimes(1);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, expect.any(Function), CacheInfo.TransactionPool.ttl, CacheInfo.TransactionPool.ttl, true);

      const pool = await service.getPool(new QueryPagination({ from: 0, size: 100 }), filter);
      expect(pool?.length).toBeGreaterThan(0);
      expect(poolCount).toStrictEqual(pool?.length);
    });

    it('should work and return the pool count with filters', async () => {
      let poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.Transaction }));
      expect(poolCount).toStrictEqual(1);

      poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.SmartContractResult }));
      expect(poolCount).toStrictEqual(1);

      poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }));
      expect(poolCount).toStrictEqual(5);
    });
  });

  describe('pool too large', () => {
    it('should read a pool too large for the gateway response limit as null', async () => {
      gatewayService.getTransactionPool = jest.fn().mockResolvedValue(null);

      expect(await service.getTxPoolRaw()).toBeNull();
    });

    it('should answer null from the cached null, without downloading the pool again', async () => {
      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? null : await createValueFunc();
      });
      gatewayService.getTransactionPool = jest.fn();

      expect(await service.getPool(new QueryPagination(), new PoolFilter())).toBeNull();
      expect(await service.getTransactionFromPool('e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da')).toBeNull();
      expect(gatewayService.getTransactionPool).not.toHaveBeenCalled();
    });

    it('should fail the pool with filters, like any other failure, while the pool is too large', async () => {
      cacheService.getOrSet = jest.fn().mockResolvedValue(null);

      await expect(service.getPoolWithFilters({ senderShard: 0 })).rejects.toBeInstanceOf(TransactionPoolTooLargeException);
    });

    it('should count the total through the gateway, cached, whatever the filters', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);
      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? null : await createValueFunc();
      });

      expect(await service.getPoolCount(new PoolFilter())).toStrictEqual(42);
      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }))).toStrictEqual(42);
      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward, sender: 'erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx' }))).toStrictEqual(42);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount.key, expect.any(Function), CacheInfo.TransactionPoolCount.ttl);
      expect(gatewayService.getTransactionPoolCount).toHaveBeenCalledTimes(3);
    });
  });

  describe('pool failing for another reason', () => {
    it('should still count the total through the gateway', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);
      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? await Promise.reject(new Error('gateway unreachable')) : await createValueFunc();
      });

      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }))).toStrictEqual(42);
      await expect(service.getPool(new QueryPagination(), new PoolFilter())).rejects.toThrow('gateway unreachable');
    });
  });

  describe('getTransactionFromPool', () => {
    it('should work and return the transaction', async () => {
      const tx = await service.getTransactionFromPool("e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da");
      expect(tx).toBeDefined();
    });

    it('should not find a tx hash that is not in the pool', async () => {
      const tx = await service.getTransactionFromPool("e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01d0");
      expect(tx).toBeUndefined();
    });
  });
});
