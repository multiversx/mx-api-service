import { Test } from "@nestjs/testing";
import { IndexerService } from "src/common/indexer/indexer.service";
import { AccountQueryOptions } from "src/endpoints/accounts/entities/account.query.options";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionGetService } from "src/endpoints/transactions/transaction.get.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";

describe('Transfers Service', () => {
  let service: TransferService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: IndexerService,
          useValue: {
            getTransfers: jest.fn(),
            getTransfersCount: jest.fn(),
            getBlockByMiniBlockHash: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            applyBlockInfo: jest.fn(),
            processTransactions: jest.fn(),
            processRelayedInfo: jest.fn(),
          },
        },
        {
          provide: TransactionGetService,
          useValue: {
            getTransactionLogsFromElastic: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<TransferService>(TransferService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransfersCount', () => {
    it('should return transfers count when no filter is applied', async () => {
      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(250000);

      const result = await service.getTransfersCount(new TransactionFilter());

      expect(indexerServiceMock).toHaveBeenCalled();
      expect(result).toStrictEqual(250000);
    });

    it('should return the count of transfers filtered by address ', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(100);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(100);
    });

    it('should return the count of transfers filtered by sender', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by senders', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.senders = [
        'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        'erd15hmuycqw4mkaksfp0yu0auy548urd0wp6wyd4vtjkg3t6h9he5ystm2sv6'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(300);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(300);
    });

    it('should return the count of transfers filtered by receivers', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.receivers = [
        'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        'erd15hmuycqw4mkaksfp0yu0auy548urd0wp6wyd4vtjkg3t6h9he5ystm2sv6'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(400);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(400);
    });

    it('should return the count of transfers filtered by token', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.token = 'WEGLD-bd4d79';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(50);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(50);
    });

    it('should return the count of transfers filtered by functions', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.functions = ['claim_rewards', 'stake'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10);
    });

    it('should return the count of transfers filtered by senderShard', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.senderShard = 2;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10000);
    });

    it('should return the count of transfers filtered by miniBlockHash', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.miniBlockHash = '9b0dafc6445b9195cb8a4266aa21517597e0ed3444f40f7a76b3a46903a7a7d5';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(50000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(50000);
    });

    it('should return the count of transfers filtered by hashes', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.hashes = [
        '9b0dafc6445b9195cb8a4266aa21517597e0ed3444f40f7a76b3a46903a7a7d5',
        'fab9173ab8835b0d34eb5fe27da2bcfde8ee3e2db4a0d5d6441f1afbee65f420'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by status', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.status = TransactionStatus.success;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by before', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.before = 1679690544;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by after', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.before = 1579690544;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by transaction type', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.type = TransactionType.Transaction;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(150);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(150);
    });

    it('should return the count of transfers filtered by SmartContractResult type', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.type = TransactionType.Transaction;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(150);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(150);
    });

    it('should return the count of transfers filtered by tokens', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.tokens = ['UTK-2f80e9', 'WEGLD-bd4d79'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10000);
    });

    it('should return the count of transfers filtered by senderOrReceiver', async () => {
      const filter: TransactionFilter = new AccountQueryOptions();
      filter.senderOrReceiver = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(2);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(2);
    });
  });
  describe('getTransfers - local sorting', () => {
    // elastic order, the smart contract result's parent is not in this page so it is moved last
    const options = (init?: Partial<TransactionQueryOptions>) => new TransactionQueryOptions({ withOperations: false, withLogs: false, ...init });

    const elasticOperations = () => [
      { txHash: 'a', type: 'normal', nonce: 5, timestamp: 100, searchAfter: 'cursor-1' },
      { txHash: 'x', type: 'unsigned', originalTxHash: 'missing', timestamp: 100, searchAfter: 'cursor-2' },
      { txHash: 'c', type: 'normal', nonce: 4, timestamp: 100, searchAfter: 'cursor-3' },
      { txHash: 'b', type: 'normal', nonce: 3, timestamp: 100, searchAfter: 'cursor-4' },
    ];

    it('keeps the elastic cursors on their positions after sorting', async () => {
      jest.spyOn(service['indexerService'], 'getTransfers').mockResolvedValue(elasticOperations() as any);

      const result = await service.getTransfers(new TransactionFilter(), new QueryPagination({ size: 4 }), options());

      expect(result.map(transfer => transfer.txHash)).toEqual(['a', 'c', 'b', 'x']);
      expect(result.map(transfer => transfer.searchAfter)).toEqual(['cursor-1', 'cursor-2', 'cursor-3', 'cursor-4']);
    });

    it('sorts the pages requested with searchAfter as well', async () => {
      jest.spyOn(service['indexerService'], 'getTransfers').mockResolvedValue(elasticOperations() as any);

      const result = await service.getTransfers(new TransactionFilter(), new QueryPagination({ size: 4, searchAfter: 'cursor-0' }), options());

      expect(result.map(transfer => transfer.txHash)).toEqual(['a', 'c', 'b', 'x']);
      expect(result[result.length - 1].searchAfter).toBe('cursor-4');
    });

    it('follows the requested order when it is ascending', async () => {
      const ascendingOperations = [
        { txHash: 'b', type: 'normal', nonce: 3, timestamp: 100, searchAfter: 'cursor-1' },
        { txHash: 'c', type: 'normal', nonce: 4, timestamp: 100, searchAfter: 'cursor-2' },
        { txHash: 'x', type: 'unsigned', originalTxHash: 'missing', timestamp: 100, searchAfter: 'cursor-3' },
        { txHash: 'a', type: 'normal', nonce: 5, timestamp: 100, searchAfter: 'cursor-4' },
      ];
      jest.spyOn(service['indexerService'], 'getTransfers').mockResolvedValue(ascendingOperations as any);

      const result = await service.getTransfers(
        new TransactionFilter({ order: SortOrder.asc }),
        new QueryPagination({ size: 4, searchAfter: 'cursor-0' }),
        options(),
      );

      expect(result.map(transfer => transfer.txHash)).toEqual(['x', 'b', 'c', 'a']);
      expect(result.map(transfer => transfer.searchAfter)).toEqual(['cursor-1', 'cursor-2', 'cursor-3', 'cursor-4']);
    });

    it('accepts searchAfter together with withTxsOrder and miniBlockHash', async () => {
      jest.spyOn(service['indexerService'], 'getTransfers').mockResolvedValue(elasticOperations() as any);
      jest.spyOn(service['indexerService'], 'getBlockByMiniBlockHash').mockResolvedValue(undefined);

      const result = await service.getTransfers(
        new TransactionFilter({ miniBlockHash: 'miniblock' }),
        new QueryPagination({ size: 4, searchAfter: 'cursor-0' }),
        options({ withTxsOrder: true }),
      );

      expect(result).toHaveLength(4);
      expect(result[result.length - 1].searchAfter).toBe('cursor-4');
    });
  });
});
