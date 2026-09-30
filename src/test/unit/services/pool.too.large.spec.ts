import { NotFoundException } from "@nestjs/common";
import { PoolGateway } from "src/crons/websocket/pool.gateway";
import { TransactionPoolTooLargeException } from "src/endpoints/pool/entities/transaction.pool.too.large.exception";
import { PoolUpdateStatus } from "src/endpoints/pool/entities/pool.update.status";
import { PoolController } from "src/endpoints/pool/pool.controller";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

describe('Transaction pool too large', () => {
  const txHash = 'e07af9835b6da5740d0f791cfe65491a562852c57d44af63fdc14be5d73f01da';

  let poolService: any;

  beforeEach(() => {
    poolService = {
      getPool: jest.fn().mockResolvedValue(null),
      getTransactionFromPool: jest.fn().mockResolvedValue(null),
      getPoolCount: jest.fn().mockResolvedValue(42),
    };
  });

  describe('PoolController', () => {
    let controller: PoolController;

    beforeEach(() => {
      controller = new PoolController(poolService);
    });

    it('should answer the pool and the transaction with the too large exception', async () => {
      await expect(controller.getTransactionPool(0, 25)).rejects.toBeInstanceOf(TransactionPoolTooLargeException);
      await expect(controller.getTransactionFromPool(txHash)).rejects.toBeInstanceOf(TransactionPoolTooLargeException);
    });

    it('should answer the count, whatever the filters', async () => {
      expect(await controller.getTransactionPoolCount()).toStrictEqual(42);
      expect(await controller.getTransactionPoolCount(undefined, undefined, undefined, undefined, TransactionType.Reward)).toStrictEqual(42);
      expect(await controller.getTransactionPoolCount('erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx')).toStrictEqual(42);
    });

    it('should answer the too large exception as unavailable, with a code and a message', () => {
      const exception = new TransactionPoolTooLargeException();

      expect(exception.getStatus()).toStrictEqual(503);
      expect(exception.getResponse()).toEqual({ statusCode: 503, code: 'transaction_pool_too_large', message: 'The transaction pool is too large to be displayed' });
    });

    it('should keep answering other failures as errors', async () => {
      poolService.getPool.mockRejectedValue(new Error('gateway unreachable'));
      poolService.getTransactionFromPool.mockResolvedValue(undefined);

      await expect(controller.getTransactionPool(0, 25)).rejects.toThrow('gateway unreachable');
      await expect(controller.getTransactionFromPool(txHash)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('TransactionService price per unit', () => {
    it('should handle a pool too large like any other failure of the pool', async () => {
      const transactionService: TransactionService = Object.assign(Object.create(TransactionService.prototype), {
        blockService: { getBlocks: jest.fn().mockResolvedValue([{ nonce: 100 }]) },
        networkService: { getConstants: jest.fn().mockResolvedValue({ minGasLimit: 50000, gasPerDataByte: 1500, gasPriceModifier: '0.01' }) },
        poolService: { getPoolWithFilters: jest.fn().mockRejectedValue(new TransactionPoolTooLargeException()) },
        logger: { error: jest.fn() },
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

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.tooLarge, pool: null, poolCount: 42 });
    });

    it('should send a null pool with the total count to a room filtered by type', async () => {
      await gateway.pushPoolForRoom(`pool-{"from":0,"size":25,"type":"${TransactionType.Reward}"}`);

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.tooLarge, pool: null, poolCount: 42 });
    });

    it('should send the pool when it can be read', async () => {
      poolService.getPool.mockResolvedValue([{ txHash }]);

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.success, pool: [{ txHash }], poolCount: 42 });
    });

    it('should send the internal server error status with the count when the pool fails for another reason', async () => {
      poolService.getPool.mockRejectedValue(new Error('gateway unreachable'));

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.internalServerError, pool: null, poolCount: 42 });
    });

    it('should send the internal server error status without a count when the count fails as well', async () => {
      poolService.getPool.mockRejectedValue(new Error('gateway unreachable'));
      poolService.getPoolCount.mockRejectedValue(new Error('gateway unreachable'));

      await gateway.pushPoolForRoom('pool-{"from":0,"size":25}');

      expect(emit).toHaveBeenCalledWith('poolUpdate', { status: PoolUpdateStatus.internalServerError, pool: null, poolCount: null });
    });
  });
});
