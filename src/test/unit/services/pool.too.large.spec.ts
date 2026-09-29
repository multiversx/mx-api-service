import { NotFoundException } from "@nestjs/common";
import { PoolGateway } from "src/crons/websocket/pool.gateway";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { TransactionPoolTooLarge } from "src/endpoints/pool/entities/transaction.pool.too.large";
import { TransactionPoolTooLargeError } from "src/endpoints/pool/entities/transaction.pool.too.large.error";
import { PoolController } from "src/endpoints/pool/pool.controller";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

describe('Transaction pool too large', () => {
  const tooLarge = { tooLarge: true, message: 'The transaction pool is too large to be displayed' };
  const txHash = 'e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da';

  let poolService: any;

  beforeEach(() => {
    poolService = {
      getPool: jest.fn().mockRejectedValue(new TransactionPoolTooLargeError()),
      getTransactionFromPool: jest.fn().mockRejectedValue(new TransactionPoolTooLargeError()),
      // the total comes from the gateway, only counts that need the pool fail
      getPoolCount: jest.fn().mockImplementation(async (filter: PoolFilter) => {
        return filter.type ? await Promise.reject(new TransactionPoolTooLargeError()) : 42;
      }),
    };
  });

  describe('PoolController', () => {
    let controller: PoolController;

    beforeEach(() => {
      controller = new PoolController(poolService);
    });

    it('should answer the pool, the transaction and the counts that need the pool with a custom response', async () => {
      expect(await controller.getTransactionPool(0, 25)).toStrictEqual(new TransactionPoolTooLarge());
      expect(await controller.getTransactionPool(0, 25)).toEqual(tooLarge);
      expect(await controller.getTransactionFromPool(txHash)).toEqual(tooLarge);
      expect(await controller.getTransactionPoolCount(undefined, undefined, undefined, undefined, TransactionType.Reward)).toEqual(tooLarge);
    });

    it('should still answer the total count', async () => {
      expect(await controller.getTransactionPoolCount()).toStrictEqual(42);
    });

    it('should keep answering other failures as errors', async () => {
      poolService.getPool.mockRejectedValue(new Error('gateway unreachable'));
      poolService.getTransactionFromPool.mockResolvedValue(undefined);

      await expect(controller.getTransactionPool(0, 25)).rejects.toThrow('gateway unreachable');
      await expect(controller.getTransactionFromPool(txHash)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('PoolGateway', () => {
    let gateway: PoolGateway;
    let emit: jest.Mock;

    beforeEach(() => {
      emit = jest.fn();
      gateway = new PoolGateway(poolService);
      gateway.server = { to: jest.fn().mockReturnValue({ emit }) } as any;
    });

    it('should send the room an empty pool marked as too large, with the total count', async () => {
      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: [], poolCount: 42, tooLarge: true });
    });

    it('should send no count to a room that filters by type, as that count needs the pool', async () => {
      await gateway.pushPoolForRoom(`pool-{"from":0,"size":25,"type":"${TransactionType.Reward}"}`);

      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: [], poolCount: null, tooLarge: true });
    });

    it('should send the pool as before when it can be read', async () => {
      poolService.getPool.mockResolvedValue([{ txHash }]);

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: [{ txHash }], poolCount: 42 });
    });
  });
});
