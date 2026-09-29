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
import { TransactionPoolTooLargeException } from "src/endpoints/pool/entities/transaction.pool.too.large.exception";
import { CacheInfo } from "src/utils/cache.info";

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
            get: jest.fn(),
            set: jest.fn(),
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

    // the pool is served from the cache, every other value is computed
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
      expect(pool[0].type).toStrictEqual(TransactionType.Transaction);
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
      expect(pool[0].type).toStrictEqual(TransactionType.Reward);
    });
  });

  describe('getPoolCount', () => {
    it('should return the total counted by the gateway', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);

      const poolCount = await service.getPoolCount(new PoolFilter());
      expect(poolCount).toStrictEqual(42);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, expect.any(Function), CacheInfo.TransactionPoolCount().ttl);
      expect(cacheService.getOrSet).not.toHaveBeenCalledWith(CacheInfo.TransactionPool.key, expect.anything(), expect.anything());
    });

    it('should count the pool when the gateway cannot count it', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(null);

      const poolCount = await service.getPoolCount(new PoolFilter());
      expect(poolCount).toStrictEqual(7);
    });

    it('should cache the count for a type apart from the total', async () => {
      const poolCount = await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }));
      expect(poolCount).toStrictEqual(5);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount(TransactionType.Reward).key, expect.any(Function), CacheInfo.TransactionPoolCount(TransactionType.Reward).ttl);
      expect(CacheInfo.TransactionPoolCount(TransactionType.Reward).key).not.toStrictEqual(CacheInfo.TransactionPoolCount().key);
      expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
    });

    it('should count the pool, without caching the count, for other filters', async () => {
      const filter = new PoolFilter({ type: TransactionType.Transaction, senderShard: 0 });

      const poolCount = await service.getPoolCount(filter);
      expect(cacheService.getOrSet).toHaveBeenCalledTimes(1);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPool.key, expect.any(Function), CacheInfo.TransactionPool.ttl);

      const pool = await service.getPool(new QueryPagination({ from: 0, size: 100 }), filter);
      expect(pool.length).toBeGreaterThan(0);
      expect(poolCount).toStrictEqual(pool.length);
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

  describe('getTxPoolRaw', () => {
    it('should remember a pool too large for the gateway response limit', async () => {
      gatewayService.getTransactionPool = jest.fn().mockResolvedValue(undefined);

      await expect(service.getTxPoolRaw()).rejects.toBeInstanceOf(TransactionPoolTooLargeException);
      expect(cacheService.set).toHaveBeenCalledWith(CacheInfo.TransactionPoolTooLarge.key, true, CacheInfo.TransactionPoolTooLarge.ttl);
    });

    it('should not download the pool again while it is remembered as too large', async () => {
      cacheService.get = jest.fn().mockResolvedValue(true);
      gatewayService.getTransactionPool = jest.fn();

      await expect(service.getTxPoolRaw()).rejects.toBeInstanceOf(TransactionPoolTooLargeException);
      expect(gatewayService.getTransactionPool).not.toHaveBeenCalled();
    });

    it('should answer with a code the clients can recognize', () => {
      const exception = new TransactionPoolTooLargeException();
      expect(exception.getStatus()).toStrictEqual(503);
      expect(exception.getResponse()).toEqual(expect.objectContaining({ code: 'transaction_pool_too_large' }));
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
