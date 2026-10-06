import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { TokenTransferService } from '../../../endpoints/tokens/token.transfer.service';
import { TransactionDetailed } from '../../../endpoints/transactions/entities/transaction.detailed';
import { TransactionLog } from '../../../endpoints/transactions/entities/transaction.log';

describe('TokenTransferService', () => {
  let service: TokenTransferService;

  beforeEach(() => {
    const cachingService = { batchApplyAll: jest.fn().mockResolvedValue(undefined) } as unknown as CacheService;
    service = new TokenTransferService(cachingService, {} as any, {} as any, {} as any);
  });

  describe('getOperationsForTransaction', () => {
    it('should order operations by transaction then by smart contract results order', async () => {
      const transaction = {
        txHash: 'tx',
        sender: 'erd1sender',
        results: [
          { hash: 'scr1', nonce: 0, value: '1000', sender: 'erd1contract', receiver: 'erd1receiver' },
          { hash: 'scr2', nonce: 0, value: '0', sender: 'erd1contract', receiver: 'erd1receiver' },
        ],
      } as unknown as TransactionDetailed;

      const logs = [
        { id: 'scr2', address: 'erd1receiver', events: [{ identifier: 'writeLog', address: 'erd1receiver', topics: [] }] },
        { id: 'scr1', address: 'erd1receiver', events: [{ identifier: 'writeLog', address: 'erd1receiver', topics: [] }] },
        { id: 'tx', address: 'erd1contract', events: [{ identifier: 'writeLog', address: 'erd1contract', topics: [] }] },
      ] as unknown as TransactionLog[];

      const operations = await service.getOperationsForTransaction(transaction, logs);

      expect(operations.map(operation => `${operation.id}:${operation.action}`)).toEqual([
        'tx:writeLog',
        'scr1:transfer',
        'scr1:writeLog',
        'scr2:writeLog',
      ]);
    });
  });
});
