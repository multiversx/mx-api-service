import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { BatchTransactionStatus } from "src/endpoints/transactions.batch/entities/batch.transaction.status";
import { TransactionBatch } from "src/endpoints/transactions.batch/entities/transaction.batch";
import { TransactionBatchGroup } from "src/endpoints/transactions.batch/entities/transaction.batch.group";
import { TransactionBatchItem } from "src/endpoints/transactions.batch/entities/transaction.batch.item";
import { TransactionBatchSimplified } from "src/endpoints/transactions.batch/entities/transaction.batch.simplified";
import { TransactionBatchStatus } from "src/endpoints/transactions.batch/entities/transaction.batch.status";
import { TransactionDetailsWithResult } from "src/endpoints/transactions.batch/entities/transaction.details.with.result";
import { TransactionsBatchService } from "src/endpoints/transactions.batch/transactions.batch.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

describe('TransactionsBatchService', () => {
  let service: TransactionsBatchService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionsBatchService,
        {
          provide: TransactionService,
          useValue: {
            createTransaction: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue:
          {
            getKeys: jest.fn(),
            getRemote: jest.fn(),
            setRemote: jest.fn(),
            batchGetManyRemote: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<TransactionsBatchService>(TransactionsBatchService);
    cacheService = moduleRef.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactionBatches', () => {
    it('should get transaction batches', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const keys = ['key1', 'key2'];
      const batches = [{ batch1: 'details' }, { batch2: 'details' }];

      jest.spyOn(cacheService, 'getKeys').mockResolvedValue(keys);
      jest.spyOn(cacheService, 'batchGetManyRemote').mockResolvedValue(batches);

      const result = await service.getTransactionBatches(address);

      expect(cacheService.getKeys).toHaveBeenCalledWith(`transactionbatch:${address}:*`);
      expect(cacheService.batchGetManyRemote).toHaveBeenCalledWith(keys);
      expect(result).toEqual(batches);
    });

    it('should return an empty array if no transaction batches are found', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      jest.spyOn(cacheService, 'getKeys').mockResolvedValue([]);
      jest.spyOn(cacheService, 'batchGetManyRemote').mockResolvedValue([]);

      const result = await service.getTransactionBatches(address);

      expect(cacheService.getKeys).toHaveBeenCalledWith(`transactionbatch:${address}:*`);
      expect(cacheService.batchGetManyRemote).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('getTransactionBatch', () => {
    it('should get a transaction batch', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const batchId = 'batchId';
      const batch = { id: batchId, details: 'details' };

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(batch);

      const result = await service.getTransactionBatch(address, batchId);

      expect(cacheService.getRemote).toHaveBeenCalledWith(`transactionbatch:${address}:${batchId}`);
      expect(result).toEqual(batch);
    });

    it('should return undefined if no batch is found', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const batchId = 'batchId';

      jest.spyOn(cacheService, 'getRemote').mockResolvedValue(undefined);

      const result = await service.getTransactionBatch(address, batchId);

      expect(cacheService.getRemote).toHaveBeenCalledWith(`transactionbatch:${address}:${batchId}`);
      expect(result).toBeUndefined();
    });
  });

  describe('convertFromTransactionBatch', () => {
    it('should convert transaction batch to simplified batch correctly', () => {
      const transactionBatchItem: TransactionBatchItem = {
        transaction: {
          tx: {
            chainID: "1",
            data: "GuardAccount",
            gasLimit: 368000,
            gasPrice: 1000000000,
            nonce: 13,
            receiver: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz",
            sender: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz",
            signature: "acc6892fae65638d317ed11630e31e116aac14b837531f2a157a4892fca3dbc0e648e19433c4d4c8da4056d624f82154eb12294d6637ef22f751a487d2300c04",
            value: "0",
            version: 1,
            guardian: "erd1sfp8lm4z7n7l3r55dqaanfwy2hzsvzmqsngu9qlh3n4809ympqgqfa3l70",
            guardianSignature: "8090ad78de6215ad6c5027849265bdd32d9723d7e89ac2b8e9cf80923329a814",

          },
          hash: '1f7a4eecd26cfba8707ec3ac00707adeb71eeda7bbb53475a322c065e5360036',
          data: "GuardAccount",
        },
        status: BatchTransactionStatus.pending,
        error: "",
      };

      const transactionBatchGroup: TransactionBatchGroup = {
        items: [transactionBatchItem],
      };

      const batch: TransactionBatch = {
        id: '1f7a4eecd26cfba8707ec3ac00707adeb71eeda7bbb53475a322c065e5360036',
        groups: [transactionBatchGroup],
        status: TransactionBatchStatus.pending,
        sourceIp: '127.0.0.1',
      };

      const result = service.convertFromTransactionBatch(batch);

      expect(result.id).toStrictEqual(batch.id);
      expect(result.status).toStrictEqual(batch.status);
    });
  });

  describe('convertToTransactionBatch', () => {
    it('should convert simplified batch to transaction batch correctly', () => {
      const transactionBatchItem: TransactionDetailsWithResult = {
        chainID: "1",
        data: "GuardAccount",
        gasLimit: 368000,
        gasPrice: 1000000000,
        nonce: 13,
        receiver: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz",
        sender: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz",
        signature: "acc6892fae65638d317ed11630e31e116aac14b837531f2a157a4892fca3dbc0e648e19433c4d4c8da4056d624f82154eb12294d6637ef22f751a487d2300c04",
        value: "0",
        version: 1,
        guardian: "erd1sfp8lm4z7n7l3r55dqaanfwy2hzsvzmqsngu9qlh3n4809ympqgqfa3l70",
        guardianSignature: "8090ad78de6215ad6c5027849265bdd32d9723d7e89ac2b8e9cf80923329a814",
        status: BatchTransactionStatus.pending,
        error: "",
        hash: '1f7a4eecd26cfba8707ec3ac00707adeb71eeda7bbb53475a322c065e5360036',
      };

      const simplifiedBatch: TransactionBatchSimplified = {
        id: '1f7a4eecd26cfba8707ec3ac00707adeb71eeda7bbb53475a322c065e5360036',
        transactions: [[transactionBatchItem]],
      };

      const result = service.convertToTransactionBatch(simplifiedBatch);

      expect(result.id).toBe(simplifiedBatch.id);
      expect(result.groups.length).toBe(simplifiedBatch.transactions.length);

      for (let i = 0; i < result.groups.length; i++) {
        const resultGroup = result.groups[i];
        const simplifiedGroup = simplifiedBatch.transactions[i];

        expect(resultGroup.items.length).toBe(simplifiedGroup.length);

        for (let j = 0; j < resultGroup.items.length; j++) {
          const resultItem = resultGroup.items[j];
          const simplifiedItem = simplifiedGroup[j];
          expect(resultItem.transaction.tx).toEqual(simplifiedItem);
        }
      }
    });

    it('should handle empty transaction list correctly', () => {
      const simplifiedBatch: TransactionBatchSimplified = {
        id: 'testId-Empty-Transactions',
        transactions: [],
      };

      const result = service.convertToTransactionBatch(simplifiedBatch);

      expect(result.id).toBe(simplifiedBatch.id);
      expect(result.groups.length).toBe(0);
    });
  });
});

