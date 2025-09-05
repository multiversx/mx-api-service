import { Test, TestingModule } from '@nestjs/testing';
import { BinaryUtils } from '@multiversx/sdk-nestjs-common';
import { ApiUtils } from '@multiversx/sdk-nestjs-http';
import { TransactionGetService } from '../../../endpoints/transactions/transaction.get.service';
import { IndexerService } from '../../../common/indexer/indexer.service';
import { GatewayService } from '../../../common/gateway/gateway.service';
import { TokenTransferService } from '../../../endpoints/tokens/token.transfer.service';
import { ApiConfigService } from '../../../common/api-config/api.config.service';
import { TransactionLog } from '../../../endpoints/transactions/entities/transaction.log';
import { TransactionLogEvent } from '../../../endpoints/transactions/entities/transaction.log.event';
import { TransactionDetailed } from '../../../endpoints/transactions/entities/transaction.detailed';
import { TransactionOptionalFieldOption } from '../../../endpoints/transactions/entities/transaction.optional.field.options';
import { MiniBlockType } from '../../../endpoints/miniblocks/entities/mini.block.type';
import { TransactionStatus } from '../../../endpoints/transactions/entities/transaction.status';

describe('TransactionGetService', () => {
  let service: TransactionGetService;
  let indexerService: jest.Mocked<IndexerService>;
  let gatewayService: jest.Mocked<GatewayService>;
  let tokenTransferService: jest.Mocked<TokenTransferService>;
  let apiConfigService: jest.Mocked<ApiConfigService>;

  const mockTransactionHash = 'abc123def456';
  const mockSender = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
  const mockReceiver = 'erd15hmuycqw4mkaksfp0yu0auy548urd0wp6wyd4vtjkg3t6h9he5ystm2sv6';

  const createMockTransaction = (overrides?: any) => ({
    txHash: mockTransactionHash,
    hash: mockTransactionHash,
    miniBlockHash: 'mb123',
    nonce: 1,
    round: 12345,
    epoch: 500,
    value: '1000000000000000000',
    receiver: mockReceiver,
    sender: mockSender,
    gasPrice: 1000000000,
    gasLimit: 50000,
    gasUsed: 25000,
    data: '',
    signature: 'sig123',
    sourceShard: 0,
    destinationShard: 1,
    blockNonce: 12345,
    blockHash: 'block123',
    notarizedAtSourceInMetaNonce: 12340,
    NotarizedAtSourceInMetaHash: 'meta123',
    notarizedAtDestinationInMetaNonce: 12341,
    notarizedAtDestinationInMetaHash: 'meta124',
    miniblockType: 'TxBlock',
    miniblockHash: 'mb123',
    status: 'success',
    hyperblockNonce: 12300,
    hyperblockHash: 'hyper123',
    timestamp: 1634567890,
    searchOrder: 1,
    hasScResults: false,
    hasOperations: false,
    tokens: [],
    esdtValues: [],
    operation: 'transfer',
    function: '',
    isRelayed: false,
    ...overrides,
  });

  const createMockGatewayTransaction = (overrides?: any) => ({
    type: 'Transaction',
    processingTypeOnSource: 'Normal',
    processingTypeOnDestination: 'Normal',
    hash: mockTransactionHash,
    nonce: 1,
    value: '1000000000000000000',
    receiver: mockReceiver,
    sender: mockSender,
    gasPrice: 1000000000,
    gasLimit: 50000,
    gasUsed: 25000,
    data: '',
    signature: 'sig123',
    sourceShard: 0,
    destinationShard: 1,
    blockNonce: 12345,
    blockHash: 'block123',
    miniblockHash: 'mb123',
    status: 'success',
    round: 12345,
    fee: 100000000000000,
    timestamp: 1634567890,
    miniblockType: MiniBlockType.TxBlock,
    receipt: undefined,
    smartContractResults: undefined,
    logs: undefined,
    guardian: undefined,
    guardianSignature: undefined,
    relayerAddress: undefined,
    relayerSignature: undefined,
    receiverUsername: undefined,
    senderUsername: undefined,
    ...overrides,
  });

  beforeEach(async () => {
    const indexerServiceMock = {
      getTransactionBySenderAndNonce: jest.fn(),
      getTransactionLogs: jest.fn(),
      getTransaction: jest.fn(),
      getTransactionScResults: jest.fn(),
      getTransactionReceipts: jest.fn(),
      getNfts: jest.fn(),
    };

    const gatewayServiceMock = {
      getTransaction: jest.fn(),
    };

    const tokenTransferServiceMock = {
      getOperationsForTransaction: jest.fn(),
    };

    const apiConfigServiceMock = {
      getElasticMigratedIndicesConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionGetService,
        { provide: IndexerService, useValue: indexerServiceMock },
        { provide: GatewayService, useValue: gatewayServiceMock },
        { provide: TokenTransferService, useValue: tokenTransferServiceMock },
        { provide: ApiConfigService, useValue: apiConfigServiceMock },
      ],
    }).compile();

    service = module.get<TransactionGetService>(TransactionGetService);
    indexerService = module.get(IndexerService);
    gatewayService = module.get(GatewayService);
    tokenTransferService = module.get(TokenTransferService);
    apiConfigService = module.get(ApiConfigService);

    jest.spyOn(BinaryUtils, 'hexToBase64').mockImplementation((hex: string) => {
      if (!hex || hex.length === 0) return hex;
      return Buffer.from(hex, 'hex').toString('base64');
    });

    jest.spyOn(BinaryUtils, 'base64Encode').mockImplementation((str: string) => {
      return Buffer.from(str).toString('base64');
    });

    jest.spyOn(BinaryUtils, 'numberToHex').mockImplementation((num: number) => {
      return num.toString(16);
    });

    jest.spyOn(ApiUtils, 'mergeObjects').mockImplementation((target: any, source: any) => {
      return { ...target, ...source };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactionLogsFromElastic', () => {
    it('should handle small batch of hashes', async () => {
      const hashes = ['hash1', 'hash2'];
      const expectedLogs = [
        new TransactionLog({ id: 'hash1', address: 'addr1', events: [] }),
        new TransactionLog({ id: 'hash2', address: 'addr2', events: [] }),
      ];

      jest.spyOn(service as any, 'getTransactionLogsFromElasticInternal')
        .mockResolvedValue(expectedLogs);

      const result = await service.getTransactionLogsFromElastic(hashes);

      expect(result).toHaveLength(2);
      expect(service['getTransactionLogsFromElasticInternal']).toHaveBeenCalledWith(hashes);
    });

    it('should handle large batch of hashes (>1000)', async () => {
      const hashes = Array.from({ length: 1500 }, (_, i) => `hash${i}`);
      const firstBatch = Array.from({ length: 1000 }, (_, i) => `hash${i}`);
      const secondBatch = Array.from({ length: 500 }, (_, i) => `hash${i + 1000}`);

      const firstBatchLogs = firstBatch.map(hash => new TransactionLog({ id: hash, address: 'addr', events: [] }));
      const secondBatchLogs = secondBatch.map(hash => new TransactionLog({ id: hash, address: 'addr', events: [] }));

      jest.spyOn(service as any, 'getTransactionLogsFromElasticInternal')
        .mockResolvedValueOnce(firstBatchLogs)
        .mockResolvedValueOnce(secondBatchLogs);

      const result = await service.getTransactionLogsFromElastic(hashes);

      expect(result).toHaveLength(1500);
      expect(service['getTransactionLogsFromElasticInternal']).toHaveBeenCalledTimes(2);
      expect(service['getTransactionLogsFromElasticInternal']).toHaveBeenNthCalledWith(1, firstBatch);
      expect(service['getTransactionLogsFromElasticInternal']).toHaveBeenNthCalledWith(2, secondBatch);
    });

    it('should return empty array for empty hashes', async () => {
      const result = await service.getTransactionLogsFromElastic([]);
      expect(result).toEqual([]);
    });
  });

  describe('getTransactionLogsFromElasticInternal', () => {
    it('should use events index when configured', async () => {
      const hashes = ['hash1'];
      apiConfigService.getElasticMigratedIndicesConfig.mockReturnValue({ logs: 'events' });

      jest.spyOn(service as any, 'getTransactionLogsFromElasticInternalEventsIndex')
        .mockResolvedValue([]);

      await service['getTransactionLogsFromElasticInternal'](hashes);

      expect(service['getTransactionLogsFromElasticInternalEventsIndex']).toHaveBeenCalledWith(hashes);
    });

    it('should use logs index by default', async () => {
      const hashes = ['hash1'];
      apiConfigService.getElasticMigratedIndicesConfig.mockReturnValue({});

      jest.spyOn(service as any, 'getTransactionLogsFromElasticInternalLogsIndex')
        .mockResolvedValue([]);

      await service['getTransactionLogsFromElasticInternal'](hashes);

      expect(service['getTransactionLogsFromElasticInternalLogsIndex']).toHaveBeenCalledWith(hashes);
    });

    it('should use logs index when no config is available', async () => {
      const hashes = ['hash1'];
      apiConfigService.getElasticMigratedIndicesConfig.mockReturnValue(null as any);

      jest.spyOn(service as any, 'getTransactionLogsFromElasticInternalLogsIndex')
        .mockResolvedValue([]);

      await service['getTransactionLogsFromElasticInternal'](hashes);

      expect(service['getTransactionLogsFromElasticInternalLogsIndex']).toHaveBeenCalledWith(hashes);
    });
  });

  describe('getTransactionLogsFromElasticInternalLogsIndex', () => {
    it('should call indexer service with correct parameters', async () => {
      const hashes = ['hash1', 'hash2'];
      const expectedResult = [
        { id: 'hash1', address: 'addr1', identifier: 'test', topics: [], order: 0, originalTxHash: 'hash1' },
        { id: 'hash2', address: 'addr2', identifier: 'test', topics: [], order: 0, originalTxHash: 'hash2' },
      ];

      indexerService.getTransactionLogs.mockResolvedValue(expectedResult as any);

      const result = await service['getTransactionLogsFromElasticInternalLogsIndex'](hashes);

      expect(indexerService.getTransactionLogs).toHaveBeenCalledWith(hashes, 'logs', '_id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTransactionLogsFromElasticInternalEventsIndex', () => {
    const mockEventsData = [
      {
        txHash: 'hash1',
        logAddress: 'erd1addr1',
        identifier: 'ESDTTransfer',
        address: 'erd1addr1',
        data: '48656c6c6f', // "Hello" in hex
        additionalData: ['576f726c64'], // ["World"] in hex
        topics: ['746f70696331', '746f70696332'], // ["topic1", "topic2"] in hex
        order: 1,
        originalTxHash: 'hash1',
      },
      {
        txHash: 'hash1',
        logAddress: 'erd1addr1',
        identifier: 'transferValueOnly',
        address: 'erd1addr1',
        data: '4461746132', // "Data2" in hex
        additionalData: undefined,
        topics: ['746f70696333'],
        order: 2,
        originalTxHash: 'hash1',
      },
      {
        txHash: 'hash2',
        logAddress: 'erd1addr2',
        identifier: 'writeLog',
        address: 'erd1addr2',
        data: '',
        additionalData: [],
        topics: [],
        order: 0,
        originalTxHash: 'hash2',
      },
    ];

    it('should transform events data correctly', async () => {
      indexerService.getTransactionLogs.mockResolvedValue(mockEventsData);

      const result = await service['getTransactionLogsFromElasticInternalEventsIndex'](['hash1', 'hash2']);

      expect(indexerService.getTransactionLogs).toHaveBeenCalledWith(['hash1', 'hash2'], 'events', 'txHash');
      expect(result).toHaveLength(2);

      const hash1Log = result.find(log => log.id === 'hash1');
      expect(hash1Log).toBeDefined();
      if (hash1Log) {
        expect(hash1Log.id).toBe('hash1');
        expect(hash1Log.address).toBe('erd1addr1');
        expect(hash1Log.events).toHaveLength(2);

        const firstEvent = hash1Log.events[0];
        expect(firstEvent.identifier).toBe('ESDTTransfer');
        expect(firstEvent.address).toBe('erd1addr1');
        expect(firstEvent.order).toBe(1);
      }

      const hash2Log = result.find(log => log.id === 'hash2');
      expect(hash2Log).toBeDefined();
      if (hash2Log) {
        expect(hash2Log.id).toBe('hash2');
        expect(hash2Log.events).toHaveLength(1);
      }
    });

    it('should handle empty data correctly', async () => {
      const emptyDataEvent = {
        txHash: 'hash1',
        logAddress: 'erd1addr',
        identifier: 'test',
        address: 'erd1addr',
        data: '',
        additionalData: [''],
        topics: [''],
        order: 0,
        originalTxHash: 'hash1',
      };

      indexerService.getTransactionLogs.mockResolvedValue([emptyDataEvent]);

      const result = await service['getTransactionLogsFromElasticInternalEventsIndex'](['hash1']);

      expect(result).toHaveLength(1);
      const log = result[0];
      expect(log.events).toHaveLength(1);
      expect(log.events[0].data).toBe('');
      expect(log.events[0].additionalData).toEqual(['']);
      expect(log.events[0].topics).toEqual(['']);
    });

    it('should group events by transaction hash correctly', async () => {
      const sameHashEvents = [
        {
          txHash: 'hash1',
          logAddress: 'erd1addr',
          identifier: 'event1',
          address: 'erd1addr',
          data: '48656c6c6f',
          topics: [],
          order: 1,
          originalTxHash: 'hash1',
        },
        {
          txHash: 'hash1',
          logAddress: 'erd1addr',
          identifier: 'event2',
          address: 'erd1addr',
          data: '576f726c64',
          topics: [],
          order: 2,
          originalTxHash: 'hash1',
        },
      ];

      indexerService.getTransactionLogs.mockResolvedValue(sameHashEvents);

      const result = await service['getTransactionLogsFromElasticInternalEventsIndex'](['hash1']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('hash1');
      expect(result[0].events).toHaveLength(2);
      expect(result[0].events[0].identifier).toBe('event1');
      expect(result[0].events[1].identifier).toBe('event2');
    });

    it('should return empty array when no events found', async () => {
      indexerService.getTransactionLogs.mockResolvedValue([]);

      const result = await service['getTransactionLogsFromElasticInternalEventsIndex'](['hash1']);

      expect(result).toEqual([]);
    });
  });

  describe('tryGetTransactionFromElastic', () => {
    const mockTransaction = createMockTransaction({
      hasScResults: true,
      hasOperations: true,
      senderUserName: 'c2VuZGVy', // "sender" in base64
      receiverUsername: 'cmVjZWl2ZXI=', // "receiver" in base64
    });

    beforeEach(() => {
      indexerService.getTransaction.mockResolvedValue(mockTransaction);
      indexerService.getTransactionScResults.mockResolvedValue([]);
      indexerService.getTransactionReceipts.mockResolvedValue([]);
      jest.spyOn(service, 'getTransactionLogsFromElastic').mockResolvedValue([]);
      tokenTransferService.getOperationsForTransaction.mockResolvedValue([]);
      jest.spyOn(service as any, 'applyUsernamesToDetailedTransaction').mockImplementation(() => { });
      jest.spyOn(service, 'applyNftNameOnTransactionOperations').mockResolvedValue();
    });

    it('should return null when transaction not found', async () => {
      indexerService.getTransaction.mockResolvedValue(null);

      const result = await service.tryGetTransactionFromElastic(mockTransactionHash);

      expect(result).toBeNull();
    });

    it('should handle transaction found successfully', async () => {
      const result = await service.tryGetTransactionFromElastic(mockTransactionHash);

      expect(result).toBeDefined();
      expect(indexerService.getTransaction).toHaveBeenCalledWith(mockTransactionHash);
    });

    it('should handle scResults field mapping', async () => {
      const transactionWithScResults = createMockTransaction({
        hasScResults: true,
        hasOperations: true,
        scResults: [{ hash: 'scr1' }],
      });

      indexerService.getTransaction.mockResolvedValue(transactionWithScResults);

      const result = await service.tryGetTransactionFromElastic(mockTransactionHash);

      expect(result).toBeDefined();
    });

    it('should handle relayerAddr field mapping', async () => {
      const transactionWithRelayer = createMockTransaction({
        hasScResults: true,
        hasOperations: true,
        relayerAddr: 'erd1relayer',
      });

      indexerService.getTransaction.mockResolvedValue(transactionWithRelayer);

      const result = await service.tryGetTransactionFromElastic(mockTransactionHash);

      expect(result).toBeDefined();
    });

    it('should fetch receipts when no fields specified', async () => {
      const mockReceipts = [{
        txHash: mockTransactionHash,
        receiptHash: 'receipt123',
        value: '1000',
        sender: mockSender,
        data: '',
        timestamp: 123456789,
      }];
      indexerService.getTransactionReceipts.mockResolvedValue(mockReceipts);

      await service.tryGetTransactionFromElastic(mockTransactionHash);

      expect(indexerService.getTransactionReceipts).toHaveBeenCalledWith(mockTransactionHash);
    });

    it('should skip receipts when receipt field not requested', async () => {
      await service.tryGetTransactionFromElastic(mockTransactionHash, ['logs']);

      expect(indexerService.getTransactionReceipts).not.toHaveBeenCalled();
    });

    it('should fetch logs and operations when requested', async () => {
      const mockLogs = [new TransactionLog({ id: mockTransactionHash, events: [] })];
      jest.spyOn(service, 'getTransactionLogsFromElastic').mockResolvedValue(mockLogs);

      await service.tryGetTransactionFromElastic(mockTransactionHash, [TransactionOptionalFieldOption.logs]);

      expect(service.getTransactionLogsFromElastic).toHaveBeenCalled();
    });

    it('should handle processing error and return null', async () => {
      jest.spyOn(service, 'getTransactionLogsFromElastic').mockRejectedValue(new Error('Processing error'));

      const result = await service.tryGetTransactionFromElastic(mockTransactionHash, [TransactionOptionalFieldOption.logs]);

      expect(result).toBeNull();
    });
  });

  describe('alterDuplicatedTransferValueOnlyEvents', () => {
    it('should alter duplicated transferValueOnly events', () => {
      const backTransferEncoded = Buffer.from('BackTransfer').toString('base64');
      const asyncCallbackEncoded = Buffer.from('AsyncCallback').toString('base64');

      const events = [
        new TransactionLogEvent({
          identifier: 'transferValueOnly',
          data: backTransferEncoded,
          topics: ['topic1', 'topic2'],
        }),
        new TransactionLogEvent({
          identifier: 'transferValueOnly',
          data: asyncCallbackEncoded,
          topics: ['topic1', 'topic2'],
        }),
        new TransactionLogEvent({
          identifier: 'otherEvent',
          data: 'otherData',
          topics: ['topic3'],
        }),
      ];

      service['alterDuplicatedTransferValueOnlyEvents'](events);

      expect(events[1].topics[0]).toBe(Buffer.from('0', 'hex').toString('base64'));
      expect(events[0].topics[0]).toBe('topic1');
      expect(events[2].topics[0]).toBe('topic3');
    });

    it('should not alter when conditions are not met', () => {
      const events = [
        new TransactionLogEvent({
          identifier: 'transferValueOnly',
          data: Buffer.from('BackTransfer').toString('base64'),
          topics: ['topic1'],
        }),
      ];

      const originalTopics = [...events[0].topics];

      service['alterDuplicatedTransferValueOnlyEvents'](events);

      expect(events[0].topics).toEqual(originalTopics);
    });
  });

  describe('removeDuplicatedESDTTransferEvents', () => {
    it('should remove duplicate ESDTTransfer events with identical content', () => {
      const events = [
        new TransactionLogEvent({
          identifier: 'ESDTTransfer',
          address: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
          topics: ['T05FLTgzYTdjMA==', '', 'CteOvFrGIAAA', 'O7KEpcfOqbXzBNR3sVA22d7LTk6wxoyr3gsDuSXrKdg='],
          additionalData: ['', 'RVNEVFRyYW5zZmVy', 'T05FLTgzYTdjMA==', 'CteOvFrGIAAA'],
        }),
        new TransactionLogEvent({
          identifier: 'writeLog',
          address: 'erd18wegffw8e65mtucy63mmz5pkm80vknjwkrrge277pvpmjf0t98vq0wgr49',
          topics: ['ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE='],
          data: 'QDZmNmI=',
          additionalData: ['QDZmNmI='],
        }),
        new TransactionLogEvent({
          identifier: 'ESDTTransfer',
          address: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
          topics: ['T05FLTgzYTdjMA==', '', 'CteOvFrGIAAA', 'O7KEpcfOqbXzBNR3sVA22d7LTk6wxoyr3gsDuSXrKdg='],
          additionalData: ['', 'RVNEVFRyYW5zZmVy', 'T05FLTgzYTdjMA==', 'CteOvFrGIAAA'],
        }),
        new TransactionLogEvent({
          identifier: 'completedTxEvent',
          address: 'erd18wegffw8e65mtucy63mmz5pkm80vknjwkrrge277pvpmjf0t98vq0wgr49',
          topics: ['RaB5PmNc/Gb1ucHpxQ8Q2XviQgobRKw0nvrlRqSpED4='],
        }),
      ];

      service['removeDuplicatedESDTTransferEvents'](events);

      expect(events.length).toBe(3);

      const esdtTransferEvents = events.filter(e => e.identifier === 'ESDTTransfer');
      expect(esdtTransferEvents.length).toBe(1);

      expect(events.filter(e => e.identifier === 'writeLog').length).toBe(1);
      expect(events.filter(e => e.identifier === 'completedTxEvent').length).toBe(1);
    });

    it('should not remove ESDTTransfer events with different content', () => {
      const events = [
        new TransactionLogEvent({
          identifier: 'ESDTTransfer',
          address: 'erd1address1',
          topics: ['topic1', 'topic2'],
          data: 'data1',
          additionalData: ['additional1'],
        }),
        new TransactionLogEvent({
          identifier: 'ESDTTransfer',
          address: 'erd1address2',
          topics: ['topic3', 'topic4'],
          data: 'data2',
          additionalData: ['additional2'],
        }),
      ];

      service['removeDuplicatedESDTTransferEvents'](events);

      // Should keep both events since they have different content
      expect(events.length).toBe(2);
      expect(events.filter(e => e.identifier === 'ESDTTransfer').length).toBe(2);
    });

    it('should do nothing when there are no ESDTTransfer events', () => {
      const events = [
        new TransactionLogEvent({
          identifier: 'writeLog',
          address: 'erd1address1',
          topics: ['topic1'],
          data: 'data1',
        }),
        new TransactionLogEvent({
          identifier: 'completedTxEvent',
          address: 'erd1address2',
          topics: ['topic2'],
          data: 'data2',
        }),
      ];

      const originalLength = events.length;
      service['removeDuplicatedESDTTransferEvents'](events);

      expect(events.length).toBe(originalLength);
    });

    it('should do nothing when there is only one ESDTTransfer event', () => {
      const events = [
        new TransactionLogEvent({
          identifier: 'ESDTTransfer',
          address: 'erd1address1',
          topics: ['topic1'],
          data: 'data1',
        }),
      ];

      service['removeDuplicatedESDTTransferEvents'](events);

      expect(events.length).toBe(1);
      expect(events[0].identifier).toBe('ESDTTransfer');
    });
  });

  describe('tryGetTransactionFromGatewayForList', () => {
    it('should return transaction when gateway returns data', async () => {
      const mockGatewayTransaction = {
        txHash: mockTransactionHash,
        sender: mockSender,
        receiver: mockReceiver,
      };

      jest.spyOn(service, 'tryGetTransactionFromGateway').mockResolvedValue(mockGatewayTransaction as any);

      const result = await service.tryGetTransactionFromGatewayForList(mockTransactionHash);

      expect(result).toBeDefined();
      expect(service.tryGetTransactionFromGateway).toHaveBeenCalledWith(mockTransactionHash, false);
    });

    it('should return undefined when gateway returns null', async () => {
      jest.spyOn(service, 'tryGetTransactionFromGateway').mockResolvedValue(null);

      const result = await service.tryGetTransactionFromGatewayForList(mockTransactionHash);

      expect(result).toBeUndefined();
    });
  });

  describe('tryGetTransactionFromGateway', () => {
    const mockGatewayResponse = createMockGatewayTransaction({
      data: 'test',
      receipt: { value: 1000 },
      smartContractResults: [
        {
          hash: 'scr1',
          callType: 1,
          value: 2000,
          data: 'Hello',
        },
      ],
      logs: { events: [] },
      guardian: 'erd1guardian',
      guardianSignature: 'guardianSig',
      relayerAddress: 'erd1relayer',
      relayerSignature: 'relayerSig',
    });

    beforeEach(() => {
      gatewayService.getTransaction.mockResolvedValue(mockGatewayResponse);
    });

    it('should return null when gateway returns null', async () => {
      gatewayService.getTransaction.mockResolvedValue(null as any);

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash);

      expect(result).toBeNull();
    });

    it('should return null for SmartContractResultBlock', async () => {
      gatewayService.getTransaction.mockResolvedValue(createMockGatewayTransaction({
        miniblockType: MiniBlockType.SmartContractResultBlock,
      }));

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash);

      expect(result).toBeNull();
    });

    it('should check elastic for pending transactions', async () => {
      const pendingTransaction = createMockGatewayTransaction({
        status: 'pending',
      });

      gatewayService.getTransaction.mockResolvedValue(pendingTransaction);
      jest.spyOn(service as any, 'tryGetTransactionFromElasticBySenderAndNonce')
        .mockResolvedValue(null);

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash, true);

      expect(service['tryGetTransactionFromElasticBySenderAndNonce'])
        .toHaveBeenCalledWith(mockSender, 1);
      expect(result).toBeDefined();
    });

    it('should return null if different transaction found in elastic', async () => {
      const pendingTransaction = createMockGatewayTransaction({
        status: 'pending',
      });

      gatewayService.getTransaction.mockResolvedValue(pendingTransaction);
      jest.spyOn(service as any, 'tryGetTransactionFromElasticBySenderAndNonce')
        .mockResolvedValue({ txHash: 'different-hash' });

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash, true);

      expect(result).toBeNull();
    });

    it('should transform gateway response correctly', async () => {
      const result = await service.tryGetTransactionFromGateway(mockTransactionHash);

      expect(result).toBeDefined();
      if (result) {
        expect(result.txHash).toBe(mockTransactionHash);
        expect(result.sender).toBe(mockSender);
        expect(result.receiver).toBe(mockReceiver);
        expect(result.senderShard).toBe(0);
        expect(result.receiverShard).toBe(1);
        expect(result.inTransit).toBe(false);
      }
    });

    it('should handle inTransit status correctly', async () => {
      const pendingTransactionWithMiniblock = createMockGatewayTransaction({
        status: TransactionStatus.pending,
        miniblockHash: 'mb123',
      });

      gatewayService.getTransaction.mockResolvedValue(pendingTransactionWithMiniblock);
      jest.spyOn(service as any, 'tryGetTransactionFromElasticBySenderAndNonce')
        .mockResolvedValue(null);

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash, true);

      if (result) {
        expect(result.inTransit).toBe(true);
      }
    });

    it('should handle error and return null', async () => {
      gatewayService.getTransaction.mockRejectedValue(new Error('Gateway error'));

      const result = await service.tryGetTransactionFromGateway(mockTransactionHash);

      expect(result).toBeNull();
    });

    it('should skip elastic check when queryInElastic is false', async () => {
      const pendingTransaction = createMockGatewayTransaction({
        status: 'pending',
      });

      gatewayService.getTransaction.mockResolvedValue(pendingTransaction);
      jest.spyOn(service as any, 'tryGetTransactionFromElasticBySenderAndNonce');

      await service.tryGetTransactionFromGateway(mockTransactionHash, false);

      expect(service['tryGetTransactionFromElasticBySenderAndNonce']).not.toHaveBeenCalled();
    });
  });

  describe('applyNftNameOnTransactionOperations', () => {
    it('should handle empty operations', async () => {
      const mockTransactions = [new TransactionDetailed({ operations: [] })];

      await service.applyNftNameOnTransactionOperations(mockTransactions);

      expect(indexerService.getNfts).not.toHaveBeenCalled();
    });

    it('should handle transactions without operations', async () => {
      const mockTransactions = [new TransactionDetailed()];

      await service.applyNftNameOnTransactionOperations(mockTransactions);

      expect(indexerService.getNfts).not.toHaveBeenCalled();
    });
  });

  describe('tryGetTransactionFromElasticBySenderAndNonce', () => {
    it('should return first transaction found', async () => {
      const mockTransactions = [
        { txHash: 'hash1', sender: mockSender, nonce: 1 },
        { txHash: 'hash2', sender: mockSender, nonce: 1 },
      ];

      indexerService.getTransactionBySenderAndNonce.mockResolvedValue(mockTransactions as any);

      const result = await service['tryGetTransactionFromElasticBySenderAndNonce'](mockSender, 1);

      expect(result).toEqual(mockTransactions[0]);
      expect(indexerService.getTransactionBySenderAndNonce).toHaveBeenCalledWith(mockSender, 1);
    });

    it('should return undefined when no transactions found', async () => {
      indexerService.getTransactionBySenderAndNonce.mockResolvedValue([]);

      const result = await service['tryGetTransactionFromElasticBySenderAndNonce'](mockSender, 1);

      expect(result).toBeUndefined();
    });
  });
});
