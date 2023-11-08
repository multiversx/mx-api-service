import { BinaryUtils, StringUtils } from "@multiversx/sdk-nestjs-common";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Operation } from "src/common/indexer/entities";
import { IndexerService } from "src/common/indexer/indexer.service";
import { AccountFilter } from "src/endpoints/accounts/entities/account.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionStatus } from "src/endpoints/transactions/entities/transaction.status";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";

describe('Transfers Service', () => {
  let service: TransferService;
  let indexerService: IndexerService;
  let apiConfigService: ApiConfigService;
  let transactionService: TransactionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: IndexerService,
          useValue: {
            getTransfers: jest.fn(),
            getTransfersCount: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            applyBlockInfo: jest.fn(),
            processTransactions: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMetaChainShardId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<TransferService>(TransferService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    transactionService = moduleRef.get<TransactionService>(TransactionService);
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
      const filter: TransactionFilter = new AccountFilter();
      filter.address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(100);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(100);
    });

    it('should return the count of transfers filtered by sender', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.sender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by senders', async () => {
      const filter: TransactionFilter = new AccountFilter();
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
      const filter: TransactionFilter = new AccountFilter();
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
      const filter: TransactionFilter = new AccountFilter();
      filter.token = 'WEGLD-bd4d79';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(50);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(50);
    });

    it('should return the count of transfers filtered by functions', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.functions = ['claim_rewards', 'stake'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10);
    });

    it('should return the count of transfers filtered by senderShard', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.senderShard = 2;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10000);
    });

    it('should return the count of transfers filtered by miniBlockHash', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.miniBlockHash = '9b0dafc6445b9195cb8a4266aa21517597e0ed3444f40f7a76b3a46903a7a7d5';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(50000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(50000);
    });

    it('should return the count of transfers filtered by hashes', async () => {
      const filter: TransactionFilter = new AccountFilter();
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
      const filter: TransactionFilter = new AccountFilter();
      filter.status = TransactionStatus.success;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by before', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.before = 1679690544;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by after', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.before = 1579690544;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(200);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(200);
    });

    it('should return the count of transfers filtered by transaction type', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.type = TransactionType.Transaction;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(150);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(150);
    });

    it('should return the count of transfers filtered by SmartContractResult type', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.type = TransactionType.Transaction;

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(150);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(150);
    });

    it('should return the count of transfers filtered by tokens', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.tokens = ['UTK-2f80e9', 'WEGLD-bd4d79'];

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(10000);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(10000);
    });

    it('should return the count of transfers filtered by senderOrReceiver', async () => {
      const filter: TransactionFilter = new AccountFilter();
      filter.senderOrReceiver = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

      const indexerServiceMock = jest.spyOn(service['indexerService'], 'getTransfersCount')
        .mockResolvedValue(2);

      const result = await service.getTransfersCount(filter);

      expect(indexerServiceMock).toHaveBeenCalledWith(filter);
      expect(result).toStrictEqual(2);
    });
  });

  describe('getTransfers', () => {
    const mockElasticOperations: Operation[] = [
      {
        hash: '97f859debd4d68b5cf69d1659c7dd48009dc9f1f87774812907f68dd60d11f11',
        miniBlockHash: 'd1df5a025f57aa1fbbb09bb5b0ab5cb08ed972d2bf56a87d4c63407dd876657b',
        nonce: 339,
        round: 17221533,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllllls27850s',
        sender: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7',
        receiverShard: 4294967295,
        senderShard: 4294967295,
        gasPrice: '1000000000',
        gasLimit: '12000000',
        gasUsed: '6075500',
        fee: '135500000000000',
        data: 'cmVEZWxlZ2F0ZVJld2FyZHM=',
        signature: '45da4a3fa98f76fea8843bac2b30f807aa136bee9a128ebdb5031eff39db6a191416cd159ca9c118ce0ceccc584cbbf298ce7ddcb6427371749a879d0c3a0e05',
        timestamp: 1699446798,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        type: 'normal',
        operation: 'transfer',
        function: '6e6f646573436f6e666967',
        canBeIgnored: false,
        esdtValues: [],
        receivers: [],
        receiversShardIDs: [],
        scResults: [],
        tokens: [],
      },
      {
        hash: '2fbb24458f6e8ac233aaffdf1a5d93710650563c541d3566aff1e56d319d28b9',
        miniBlockHash: '8a4eb533f2b2ed8543c461d00d7db55fa496144af882cc002233aab1a6c9b107',
        nonce: 339,
        round: 17221533,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllllls27850s',
        sender: 'erd1wh9c0sjr2xn8hzf02lwwcr4jk2s84tat9ud2kaq6zr7xzpvl9l5q8awmex',
        receiverShard: 4294967295,
        senderShard: 1,
        gasPrice: '1000000000',
        gasLimit: '12000000',
        gasUsed: '6075500',
        fee: '135500000000000',
        data: 'cmVEZWxlZ2F0ZVJld2FyZHM=',
        signature: '45da4a3fa98f76fea8843bac2b30f807aa136bee9a128ebdb5031eff39db6a191416cd159ca9c118ce0ceccc584cbbf298ce7ddcb6427371749a879d0c3a0e05',
        timestamp: 1699446798,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        type: 'Transaction',
        operation: 'unStakeNodes',
        function: 'unStakeNodes',
        canBeIgnored: false,
        esdtValues: [],
        receivers: [],
        receiversShardIDs: [],
        scResults: [],
        tokens: [],
      },
    ];
    it('should return an array of transfers', async () => {
      jest.spyOn(indexerService, 'getTransfers').mockResolvedValue(mockElasticOperations);

      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = new TransactionQueryOptions();
      const transactions = await service.getTransfers(filter, pagination, queryOptions);

      expect(transactions).toBeInstanceOf(Array);
    });

    it('should decode function when senderShard and receiverShard are metaChainShardId', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = new TransactionQueryOptions();

      jest.spyOn(indexerService, 'getTransfers').mockResolvedValue(mockElasticOperations);
      jest.spyOn(apiConfigService, 'getMetaChainShardId').mockReturnValue(4294967295);

      jest.spyOn(StringUtils, 'isHex').mockReturnValue(true);
      jest.spyOn(BinaryUtils, 'hexToString').mockReturnValue('nodesConfig');

      const transactions = await service.getTransfers(filter, pagination, queryOptions);

      expect(transactions[0].function).toEqual('nodesConfig');
    });

    it('should decode function when senderShard and receiverShard are metaChainShardId', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = new TransactionQueryOptions();

      jest.spyOn(indexerService, 'getTransfers').mockResolvedValue(mockElasticOperations);
      jest.spyOn(apiConfigService, 'getMetaChainShardId').mockReturnValue(4294967295);

      jest.spyOn(StringUtils, 'isHex').mockReturnValue(true);
      jest.spyOn(BinaryUtils, 'hexToString').mockReturnValue('nodesConfig');

      const transactions = await service.getTransfers(filter, pagination, queryOptions);

      expect(transactions[0].function).toEqual('nodesConfig');
    });

    it('should not decode function when senderShard and receiverShard are not metaChainShardId', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = new TransactionQueryOptions();

      jest.spyOn(indexerService, 'getTransfers').mockResolvedValue(mockElasticOperations);
      jest.spyOn(StringUtils, 'isHex').mockReturnValue(false);
      const transactions = await service.getTransfers(filter, pagination, queryOptions);

      expect(transactions[1].function).toEqual('unStakeNodes');
    });

    it('should call processTransactions with correct options', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = new TransactionQueryOptions();
      const fields = ['senderBlockHash'];

      jest.spyOn(indexerService, 'getTransfers').mockResolvedValue(mockElasticOperations);

      await service.getTransfers(filter, pagination, queryOptions, fields);

      expect(transactionService.processTransactions).toHaveBeenCalledWith(expect.anything(), {
        withScamInfo: false,
        withUsername: false,
      });
    });
  });
});
