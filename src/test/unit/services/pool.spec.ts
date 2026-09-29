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

      const poolCount = await service.getPoolCount(new PoolFilter());
      expect(poolCount).toStrictEqual(7);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(CacheInfo.TransactionPoolCount().key, expect.any(Function), CacheInfo.TransactionPoolCount().ttl);
      expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
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
      gatewayService.getTransactionPool = jest.fn().mockResolvedValue(undefined);

      expect(await service.getTxPoolRaw()).toBeNull();
    });

    it('should answer null from the cached null, without downloading the pool again', async () => {
      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? null : await createValueFunc();
      });
      gatewayService.getTransactionPool = jest.fn();

      expect(await service.getPool(new QueryPagination(), new PoolFilter())).toBeNull();
      expect(await service.getTransactionFromPool('e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da')).toBeNull();
      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Reward }))).toBeNull();
      expect(await service.getPoolCount(new PoolFilter({ sender: 'erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx' }))).toBeNull();
      expect(gatewayService.getTransactionPool).not.toHaveBeenCalled();
    });

    it('should still count the total through the gateway', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);
      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? null : await createValueFunc();
      });

      expect(await service.getPoolCount(new PoolFilter())).toStrictEqual(42);
    });
  });

  describe('getPoolCountFromGateway', () => {
    it('should count the total and the transactions through the gateway', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);

      expect(await service.getPoolCountFromGateway()).toStrictEqual(42);
      expect(await service.getPoolCountFromGateway(TransactionType.Transaction)).toStrictEqual(42);
    });

    it('should not count the types the gateway does not count', async () => {
      gatewayService.getTransactionPoolCount = jest.fn();

      expect(await service.getPoolCountFromGateway(TransactionType.SmartContractResult)).toBeNull();
      expect(await service.getPoolCountFromGateway(TransactionType.Reward)).toBeNull();
      expect(gatewayService.getTransactionPoolCount).not.toHaveBeenCalled();
    });

    it('should count a type through the gateway only while the pool is too large', async () => {
      gatewayService.getTransactionPoolCount = jest.fn().mockResolvedValue(42);

      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Transaction }))).toStrictEqual(1);

      cacheService.getOrSet = jest.fn().mockImplementation(async (key: string, createValueFunc: () => Promise<any>) => {
        return key === CacheInfo.TransactionPool.key ? null : await createValueFunc();
      });

      expect(await service.getPoolCount(new PoolFilter({ type: TransactionType.Transaction }))).toStrictEqual(42);
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
