import { NotFoundException } from "@nestjs/common";
import { PoolGateway } from "src/crons/websocket/pool.gateway";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { TransactionPoolTooLarge } from "src/endpoints/pool/entities/transaction.pool.too.large";
import { PoolUpdateStatus } from "src/endpoints/pool/entities/pool.update.status";
import { PoolController } from "src/endpoints/pool/pool.controller";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

describe('Transaction pool too large', () => {
  const tooLarge = { tooLarge: true, message: 'The transaction pool is too large to be displayed' };
  const txHash = 'e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da';

  let poolService: any;

  beforeEach(() => {
    poolService = {
      // null stands for a pool too large to be read
      getPool: jest.fn().mockResolvedValue(null),
      getTransactionFromPool: jest.fn().mockResolvedValue(null),
      // the total comes from the gateway, only the counts that need the pool are null
      getPoolCount: jest.fn().mockImplementation(async (filter: PoolFilter) => await Promise.resolve(filter.type ? null : 42)),
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

  describe('TransactionService price per unit', () => {
    it('should leave the prices unknown, rather than at zero, while the pool is too large', async () => {
      // only the dependencies of the price per unit, without the constructor
      const transactionService: TransactionService = Object.assign(Object.create(TransactionService.prototype), {
        blockService: { getBlocks: jest.fn().mockResolvedValue([{ nonce: 100 }]) },
        networkService: { getConstants: jest.fn().mockResolvedValue({ minGasLimit: 50000, gasPerDataByte: 1500, gasPriceModifier: '0.01' }) },
        poolService: { getPoolWithFilters: jest.fn().mockResolvedValue(null) },
      });

      expect(await transactionService.getPpuByShardIdRaw(1)).toBeNull();
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

    it('should send the room an empty pool with the too large status, and the total count', async () => {
      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.tooLarge, pool: [], poolCount: 42 });
    });

    it('should send no count to a room that filters by type, as that count needs the pool', async () => {
      await gateway.pushPoolForRoom(`pool-{"from":0,"size":25,"type":"${TransactionType.Reward}"}`);

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.tooLarge, pool: [], poolCount: null });
    });

    it('should send the pool with the success status when it can be read', async () => {
      poolService.getPool.mockResolvedValue([{ txHash }]);

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.success, pool: [{ txHash }], poolCount: 42 });
    });
  });
});
