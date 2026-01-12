import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { Transaction } from "src/common/indexer/entities/transaction";
import { IndexerService } from "src/common/indexer/indexer.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { NetworkService } from "src/endpoints/network/network.service";
import { PoolService } from "src/endpoints/pool/pool.service";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";
import { TransactionGetService } from "src/endpoints/transactions/transaction.get.service";
import { TransactionPriceService } from "src/endpoints/transactions/transaction.price.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { UsernameService } from "src/endpoints/usernames/username.service";

describe('TransactionService', () => {
  let service: TransactionService;
  let indexerService: IndexerService;
  let assetsService: AssetsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: IndexerService,
          useValue: {
            getTransactionCountForAddress: jest.fn(),
            getTransactionCount: jest.fn(),
            getTransactions: jest.fn(),
            getScResultsForTransactions: jest.fn(),
            getSmartContractResults: jest.fn(),
            getMiniBlocks: jest.fn(),
            getBlocks: jest.fn(),
          },
        },
        {
          provide: TransactionGetService,
          useValue: {
            tryGetTransactionFromGatewayForList: jest.fn(),
            tryGetTransactionFromElastic: jest.fn(),
            tryGetTransactionFromGateway: jest.fn(),
            getTransactionLogsFromElastic: jest.fn(),
          },
        },
        {
          provide: TokenTransferService,
          useValue: {
            getOperationsForTransaction: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue: {
            processTransactionSend: jest.fn(),
            processTransactions: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            getOrSet: jest.fn().mockImplementation(async (_key: string, getter: () => Promise<any>, _ttl: number) => {
              return await getter();
            }),
            batchGetAll: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: TransactionPriceService,
          useValue: {
            getTransactionPrice: jest.fn(),
          },
        },
        {
          provide: TransactionActionService,
          useValue: {
            getTransactionAction: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getAllAccountAssets: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getMaiarIdUrl: jest.fn(),
          },
        },
        {
          provide: UsernameService,
          useValue: {
            getUsernameForAddressRaw: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
        {
          provide: BlockService,
          useValue: {
            getBlockByHash: jest.fn(),
          },
        },
        {
          provide: PoolService,
          useValue: {
            getPool: jest.fn(),
          },
        },
        {
          provide: NetworkService,
          useValue: {
            getConstants: jest.fn(),
          },
        },

      ],
    }).compile();

    service = moduleRef.get<TransactionService>(TransactionService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    assetsService = moduleRef.get<AssetsService>(AssetsService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactionCountForAddressRaw', () => {
    it('should return transactions count for given address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      jest.spyOn(indexerService, 'getTransactionCountForAddress').mockResolvedValue(200);

      const result = await service.getTransactionCountForAddressRaw(address);

      expect(result).toStrictEqual(200);
      expect(indexerService.getTransactionCountForAddress).toHaveBeenCalledWith(address);
      expect(indexerService.getTransactionCountForAddress).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactionCount', () => {
    it('should return transactions count', async () => {
      jest.spyOn(indexerService, 'getTransactionCount').mockResolvedValue(10000);

      const result = await service.getTransactionCount(new TransactionFilter());

      expect(result).toStrictEqual(10000);
      expect(indexerService.getTransactionCount).toHaveBeenCalledWith(new TransactionFilter(), undefined);
      expect(indexerService.getTransactionCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTransactions', () => {
    const elasticTransactionsMock: Transaction[] = [
      {
        hash: '00c0e3c8dfbbf40298e58432d23c8698f198fae1b659567d372a9b2632825720',
        miniBlockHash:
          '3b5cc5fb6d6da35d2654bb36062113e94766b054a45bd0cdddcc9c8fd1737bb5',
        nonce: 85514,
        round: 17034196,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqpgq7rwhny4mx6dhuzcsymrhdsv2vmvarecgh4vq687aqr',
        receiverUserName: 'YWxpY2UyLnN1ZmZpeA==',
        receiverUsername: '',
        sender: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        senderUserName: '',
        senderUsername: '',
        receiverShard: 0,
        senderShard: 0,
        gasPrice: '1000000000',
        gasLimit: '5000000',
        gasUsed: '3260249',
        fee: '223177490000000',
        data:
          'Y2xhaW1Vc2VyQGMyNzBkOWE1NGVlYjFmN2YzOGVkZjE5MjM0ZmE1MjA0ZDRjNTZhODQwZDVhMmFkZDBkODY5OGJmZTJjNzk1OWNAMDE3YWM4NzE4ZmYyNTFjM2ZiM2M=',
        signature:
          'a151ca8de060f210bf10881ce2e958bded2862d01f8d35fd40df0ef0e51b4c15648a37c33a336713a5820aff4fce61e318796349d3f5f143d6e5e9b39fe7e501',
        timestamp: 1698322776,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        tokens: [''],
        esdtValues: ['10'],
        receivers: ['erd1', 'erd2'],
        receiversShardIDs: [1],
        operation: 'transfer',
        scResults: [''],
        relayerAddr: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        version: 1,
        relayer: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        isRelayed: true,
        isScCall: true,
        relayerSignature: 'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
        timestampMs: 1698322776000,
      },
      {
        hash: '2b1ce5558f5faa533afd437a42a5aeadea8302dc3cca778c0ed50d19c0a047a4',
        miniBlockHash:
          'fca171ea58af176a797f57673423d1755d04545a90564f98f1dbad173eea120e',
        nonce: 1893,
        round: 17034196,
        value: '0',
        receiver: 'erd1qqqqqqqqqqqqqpgq7rwhny4mx6dhuzcsymrhdsv2vmvarecgh4vq687aqr',
        receiverUserName: '',
        receiverUsername: '',
        sender: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        senderUserName: '',
        senderUsername: '',
        receiverShard: 0,
        senderShard: 0,
        gasPrice: '1000000000',
        gasLimit: '8500000',
        gasUsed: '3260249',
        fee: '223177490000000',
        data:
          'RVNEVE5GVFRyYW5zZmVyQDUzNTU1NDRiMmQ2MjYxMzMzNTY2MzNAMDc2YmE2QDAxNGFlMjAxN2ZhMzM2MTQxYjRkQDAwMDAwMDAwMDAwMDAwMDAwNTAwYzY1YjZkYzhmOTE2ZjNhZGFmYmM1Y2JjNTlhMTllNGU0NDVmMWZmOTU0ODNANjM2ZjZkNzA2Zjc1NmU2NDUyNjU3NzYxNzI2NDcz=',
        signature:
          'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
        timestamp: 1698322776,
        status: 'success',
        searchOrder: 0,
        hasScResults: true,
        hasOperations: true,
        tokens: [''],
        esdtValues: ['10'],
        receivers: ['erd1', 'erd2'],
        receiversShardIDs: [1],
        operation: 'transfer',
        scResults: [''],
        relayerAddr: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        version: 1,
        relayer: 'erd1sdrjn0uuulydacwjam3v5afl427ptk797fpcujpfcsakfck8aqjquq9afc',
        isRelayed: true,
        isScCall: true,
        relayerSignature: 'bc51e9032332740d60c404d4bf553ae225ca77a70ad799a1cdfc6e73609be8ec62e89ac6e2c2621ffbfb89e6fab620c137010662f3ebea9c422c9f1dbec04a03',
        timestampMs: 1698322776000,
      },
    ];

    const assetsAccountMock = {
      'account': new AccountAssets({
        name: 'Test',
        description: 'Test',
        icon: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        iconPng: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        iconSvg: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
        proof: '',
        tags: ["transactions", "tests", "unit"],
      }),
    };

    it('should return an array of transactions', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();

      jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValue(assetsAccountMock);

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(elasticTransactionsMock);
      const results = await service.getTransactions(filter, pagination);

      expect(results).toBeInstanceOf(Array);
      expect(results).toHaveLength(elasticTransactionsMock.length);
    });

    it('should apply block info when withBlockInfo is true', async () => {
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();
      const queryOptions = { withBlockInfo: true };

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(elasticTransactionsMock);
      jest.spyOn(service, 'applyBlockInfo').mockResolvedValue();

      await service.getTransactions(filter, pagination, queryOptions);

      expect(service.applyBlockInfo).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should reorder transactions sent by account address by nonce when address is provided', async () => {
      const accountAddress = 'erd10v2kud9534x8resv7j2zleunakq2xkjdd8craelhjjksw6y2w36qfs8w8p';
      const filter = new TransactionFilter();
      const pagination = new QueryPagination();

      const mockTransactions: Transaction[] = [
        {
          hash: 'd5a81dcf6f93c69d29d19c0db0d497839cae9ebdf45b0d6341d5e7d7b36afc41',
          miniBlockHash: 'c30138148f350bcb1cafacfc8bcca601bd55b5c5eec21e322cbf5cf162d0bdd8',
          nonce: 11,
          round: 28011213,
          value: '100000000000000000',
          receiver: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
          receiverUserName: '',
          receiverUsername: '',
          sender: accountAddress,
          senderUserName: '',
          senderUsername: '',
          receiverShard: 2,
          senderShard: 0,
          gasPrice: '1000000200',
          gasLimit: '75000',
          gasUsed: '69500',
          fee: '69500013900000',
          data: 'WW9pbmsuIEhlaGVoZQ==',
          signature: 'f61f3950c151f032185fe8d7780b19d74f99dfd050969b4202966ce4d7252c6c2810439a9b9f290d21e83927e337be72361b275b3cbdc9fe09db6401c459fb07',
          timestamp: 1764184878,
          status: 'success',
          searchOrder: 0,
          hasScResults: false,
          hasOperations: false,
          tokens: [],
          esdtValues: [],
          receivers: [],
          receiversShardIDs: [],
          operation: 'transfer',
          scResults: [],
          relayerAddr: '',
          version: 1,
          relayer: '',
          isRelayed: false,
          isScCall: false,
          relayerSignature: '',
          timestampMs: 1764184878000,
        },
        {
          hash: 'd5a81dcf6f93c69d29d19c0db0d497839cae9ebdf45b0d6341d5e7d7b36afc40',
          miniBlockHash: '2d28a4dd003b166794707b374611c3fed119e997c8fc9b162e34a378e2aee366',
          nonce: 12,
          round: 28011212,
          value: '100000000000000000',
          receiver: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
          receiverUserName: '',
          receiverUsername: '',
          sender: accountAddress,
          senderUserName: '',
          senderUsername: '',
          receiverShard: 2,
          senderShard: 0,
          gasPrice: '1000000200',
          gasLimit: '75000',
          gasUsed: '75000',
          fee: '69555013911000',
          data: 'WW9pbmsuIEhlaGVoZQ==',
          signature: '3212d61815bcc09cb7513aaf53a668259ea0d33fba76f769068a727154837845f05379c3a7fdc7d6b6b5edfe90f61cac8a65dc0de6d84244235ff4fad021e50e',
          timestamp: 1764184872,
          status: 'invalid',
          searchOrder: 0,
          hasScResults: false,
          hasOperations: false,
          tokens: [],
          esdtValues: [],
          receivers: [],
          receiversShardIDs: [],
          operation: 'transfer',
          scResults: [],
          relayerAddr: '',
          version: 1,
          relayer: '',
          isRelayed: false,
          isScCall: false,
          relayerSignature: '',
          timestampMs: 1764184872000,
        },
        {
          hash: 'abc123def456',
          miniBlockHash: 'mini123',
          nonce: 100,
          round: 28011210,
          value: '50000000000000000',
          receiver: accountAddress,
          receiverUserName: '',
          receiverUsername: '',
          sender: 'erd1qqqqqqqqqqqqqpgq7rwhny4mx6dhuzcsymrhdsv2vmvarecgh4vq687aqr',
          senderUserName: '',
          senderUsername: '',
          receiverShard: 0,
          senderShard: 1,
          gasPrice: '1000000000',
          gasLimit: '50000',
          gasUsed: '50000',
          fee: '50000000000000',
          data: '',
          signature: 'sig123',
          timestamp: 1764184875,
          status: 'success',
          searchOrder: 0,
          hasScResults: false,
          hasOperations: false,
          tokens: [],
          esdtValues: [],
          receivers: [],
          receiversShardIDs: [],
          operation: 'transfer',
          scResults: [],
          relayerAddr: '',
          version: 1,
          relayer: '',
          isRelayed: false,
          isScCall: false,
          relayerSignature: '',
          timestampMs: 1764184875000,
        },
      ];

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(mockTransactions);
      jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValue({});

      const results = await service.getTransactions(filter, pagination, undefined, accountAddress);

      const accountSentTxs = results.filter(tx => tx.sender === accountAddress);
      expect(accountSentTxs).toHaveLength(2);
      expect(accountSentTxs[0].nonce).toBe(12);
      expect(accountSentTxs[1].nonce).toBe(11);
    });

    it('should not reorder transactions when sender or receiver filter is applied', async () => {
      const accountAddress = 'erd10v2kud9534x8resv7j2zleunakq2xkjdd8craelhjjksw6y2w36qfs8w8p';
      const filter = new TransactionFilter({ sender: accountAddress });
      const pagination = new QueryPagination();

      const mockTransactions: Transaction[] = [
        {
          hash: 'tx1hash',
          miniBlockHash: 'mini1',
          nonce: 11,
          round: 1000,
          value: '1000000',
          receiver: 'erd1receiver',
          receiverUserName: '',
          receiverUsername: '',
          sender: accountAddress,
          senderUserName: '',
          senderUsername: '',
          receiverShard: 0,
          senderShard: 0,
          gasPrice: '1000000000',
          gasLimit: '50000',
          gasUsed: '50000',
          fee: '50000000000000',
          data: '',
          signature: 'sig1',
          timestamp: 1764184878,
          status: 'success',
          searchOrder: 0,
          hasScResults: false,
          hasOperations: false,
          tokens: [],
          esdtValues: [],
          receivers: [],
          receiversShardIDs: [],
          operation: 'transfer',
          scResults: [],
          relayerAddr: '',
          version: 1,
          relayer: '',
          isRelayed: false,
          isScCall: false,
          relayerSignature: '',
          timestampMs: 1764184878000,
        },
        {
          hash: 'tx2hash',
          miniBlockHash: 'mini2',
          nonce: 12,
          round: 999,
          value: '1000000',
          receiver: 'erd1receiver',
          receiverUserName: '',
          receiverUsername: '',
          sender: accountAddress,
          senderUserName: '',
          senderUsername: '',
          receiverShard: 0,
          senderShard: 0,
          gasPrice: '1000000000',
          gasLimit: '50000',
          gasUsed: '50000',
          fee: '50000000000000',
          data: '',
          signature: 'sig2',
          timestamp: 1764184872,
          status: 'success',
          searchOrder: 0,
          hasScResults: false,
          hasOperations: false,
          tokens: [],
          esdtValues: [],
          receivers: [],
          receiversShardIDs: [],
          operation: 'transfer',
          scResults: [],
          relayerAddr: '',
          version: 1,
          relayer: '',
          isRelayed: false,
          isScCall: false,
          relayerSignature: '',
          timestampMs: 1764184872000,
        },
      ];

      jest.spyOn(indexerService, 'getTransactions').mockResolvedValue(mockTransactions);
      jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValue({});

      const results = await service.getTransactions(filter, pagination, undefined, accountAddress);

      expect(results[0].nonce).toBe(11);
      expect(results[1].nonce).toBe(12);
    });
  });
});
