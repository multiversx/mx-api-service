import { NotFoundException } from "@nestjs/common";
import { PoolGateway } from "src/crons/websocket/pool.gateway";
import { PoolFilter } from "src/endpoints/pool/entities/pool.filter";
import { TransactionPoolTooLarge } from "src/endpoints/pool/entities/transaction.pool.too.large";
import { PoolController } from "src/endpoints/pool/pool.controller";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

describe('Transaction pool too large', () => {
  const tooLarge = { tooLarge: true, message: 'The transaction pool is too large to be displayed' };
  const txHash = 'e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da';

  let poolService: any;

  beforeEach(() => {
    poolService = {
      getPool: jest.fn().mockResolvedValue(null),
      getTransactionFromPool: jest.fn().mockResolvedValue(null),
      getPoolCount: jest.fn().mockImplementation(async (filter: PoolFilter) => await Promise.resolve(filter.sender ? null : 42)),
    };
  });

  describe('PoolController', () => {
    let controller: PoolController;

    beforeEach(() => {
      controller = new PoolController(poolService);
    });

    it('should answer the pool and the transaction with a custom response', async () => {
      expect(await controller.getTransactionPool(0, 25)).toStrictEqual(new TransactionPoolTooLarge());
      expect(await controller.getTransactionPool(0, 25)).toEqual(tooLarge);
      expect(await controller.getTransactionFromPool(txHash)).toEqual(tooLarge);
    });

    it('should answer the counts the gateway gives and a custom response for the others', async () => {
      expect(await controller.getTransactionPoolCount()).toStrictEqual(42);
      expect(await controller.getTransactionPoolCount(undefined, undefined, undefined, undefined, TransactionType.Reward)).toStrictEqual(42);
      expect(await controller.getTransactionPoolCount('erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx')).toEqual(tooLarge);
    });

    it('should keep answering other failures as errors', async () => {
      poolService.getPool.mockRejectedValue(new Error('gateway unreachable'));
      poolService.getTransactionFromPool.mockResolvedValue(undefined);

      await expect(controller.getTransactionPool(0, 25)).rejects.toThrow('gateway unreachable');
      await expect(controller.getTransactionFromPool(txHash)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('TransactionService price per unit', () => {
    it('should leave the prices unknown while the pool is too large', async () => {
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

    it('should send a null pool with the total count', async () => {
      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: null, poolCount: 42 });
    });

    it('should send a null pool with the count of the type of the room', async () => {
      await gateway.pushPoolForRoom(`pool-{"from":0,"size":25,"type":"${TransactionType.Reward}"}`);

      expect(poolService.getPoolCount).toHaveBeenCalledWith(new PoolFilter({ type: TransactionType.Reward }));
      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: null, poolCount: 42 });
    });

    it('should send the pool when it can be read', async () => {
      poolService.getPool.mockResolvedValue([{ txHash }]);

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { pool: [{ txHash }], poolCount: 42 });
    });
  });
});
