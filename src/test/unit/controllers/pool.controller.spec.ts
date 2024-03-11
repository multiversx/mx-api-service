import { INestApplication } from "@nestjs/common";
import { mockPoolService } from "./services.mock/pool.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { PoolController } from "src/endpoints/pool/pool.controller";
import { PoolModule } from "src/endpoints/pool/pool.module";
import { PoolService } from "src/endpoints/pool/pool.service";
import request = require('supertest');
import { QueryPagination } from "src/common/entities/query.pagination";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

describe('PoolController', () => {
  let app: INestApplication;
  const path = '/pool';

  const poolServiceMocks = mockPoolService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PoolController],
      imports: [PoolModule],
    }).overrideProvider(PoolService).useValue(poolServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /pool', () => {
    it('should return a list of pool transactions', async () => {
      poolServiceMocks.getPool.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(poolServiceMocks.getPool).toHaveBeenCalled();
      expect(poolServiceMocks.getPool).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        { "receiver": undefined, "sender": undefined, "type": undefined }
      );
    });

    it('should return a list of pool transactions for a given receiver', async () => {
      poolServiceMocks.getPool.mockReturnValue([]);
      const receiver = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?receiver=${receiver}`)
        .expect(200);

      expect(poolServiceMocks.getPool).toHaveBeenCalled();
      expect(poolServiceMocks.getPool).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        new PoolFilter({ receiver: receiver, sender: undefined, type: undefined })
      );
    });

    it('should return a list of pool transactions for a given sender', async () => {
      poolServiceMocks.getPool.mockReturnValue([]);
      const sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}?sender=${sender}`)
        .expect(200);

      expect(poolServiceMocks.getPool).toHaveBeenCalled();
      expect(poolServiceMocks.getPool).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        new PoolFilter({ receiver: undefined, sender: sender, type: undefined })
      );
    });

    it('should return a list of pool transactions of type SmartContractResult', async () => {
      poolServiceMocks.getPool.mockReturnValue([]);

      await request(app.getHttpServer())
        .get(`${path}?type=${TransactionType.SmartContractResult}`)
        .expect(200);

      expect(poolServiceMocks.getPool).toHaveBeenCalled();
      expect(poolServiceMocks.getPool).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }),
        new PoolFilter({ receiver: undefined, sender: undefined, type: TransactionType.SmartContractResult })
      );
    });
  });

  describe('GET /pool/count', () => {
    it('should return total pool transactions count', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(5);

      await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
    });

    it('should return total pool transactions count for a specific receiver', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(1);
      const receiver = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?receiver=${receiver}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(1);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: receiver, sender: undefined, type: undefined })
      );
    });

    it('should return total pool transactions count for a specific sender', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(2);
      const sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/count?sender=${sender}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(2);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: undefined, sender: sender, type: undefined })
      );
    });

    it('should return total pool transactions count for a specific pool type', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(3);

      await request(app.getHttpServer())
        .get(`${path}/count?type=${TransactionType.Reward}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(3);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: undefined, sender: undefined, type: TransactionType.Reward })
      );
    });
  });

  describe('GET /pool/c', () => {
    it('should return total pool transactions count', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(5);

      await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(5);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
    });

    it('should return total pool transactions count for a specific receiver', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(1);
      const receiver = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?receiver=${receiver}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(1);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: receiver, sender: undefined, type: undefined })
      );
    });

    it('should return total pool transactions count for a specific sender', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(2);
      const sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      await request(app.getHttpServer())
        .get(`${path}/c?sender=${sender}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(2);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: undefined, sender: sender, type: undefined })
      );
    });

    it('should return total pool transactions count for a specific pool type', async () => {
      poolServiceMocks.getPoolCount.mockReturnValue(3);

      await request(app.getHttpServer())
        .get(`${path}/c?type=${TransactionType.Reward}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toStrictEqual(3);
        });
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalled();
      expect(poolServiceMocks.getPoolCount).toHaveBeenCalledWith(
        new PoolFilter({ receiver: undefined, sender: undefined, type: TransactionType.Reward })
      );
    });
  });

  describe('GET /pool/:txHash', () => {
    it('should return a specific pool transactions for a given txHash', async () => {
      poolServiceMocks.getTransactionFromPool.mockReturnValue({});
      const txHash = 'c2cac690c913733b8f55c84ae21b78dcc39baed1269ae806a9fb2e100a37204d';
      await request(app.getHttpServer())
        .get(`${path}/${txHash}`)
        .expect(200);

      expect(poolServiceMocks.getTransactionFromPool).toHaveBeenCalled();
      expect(poolServiceMocks.getTransactionFromPool).toHaveBeenCalledWith(txHash);
    });

    it('should thorow 404 Not Found for a given txHash', async () => {
      poolServiceMocks.getTransactionFromPool.mockReturnValue(undefined);
      const txHash = 'c2cac690c913733b8f55c84ae21b78dcc39baed1269ae806a9fb2e100a37204s';

      await request(app.getHttpServer())
        .get(`${path}/${txHash}`)
        .expect(404)
        .expect(responsee => {
          expect(responsee.body.message).toStrictEqual('Transaction not found');
        });

      expect(poolServiceMocks.getTransactionFromPool).toHaveBeenCalled();
      expect(poolServiceMocks.getTransactionFromPool).toHaveBeenCalledWith(txHash);
    });
  });
});
