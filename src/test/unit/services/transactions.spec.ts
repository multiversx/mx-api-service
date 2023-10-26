import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: IndexerService, useValue: {
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
          provide: TransactionGetService, useValue: {
            tryGetTransactionFromGatewayForList: jest.fn(),
            tryGetTransactionFromElastic: jest.fn(),
            tryGetTransactionFromGateway: jest.fn(),
            getTransactionLogsFromElastic: jest.fn(),
          },
        },
        {
          provide: TokenTransferService, useValue: {
            getOperationsForTransaction: jest.fn(),
          },
        },
        {
          provide: PluginService, useValue: {
            processTransactionSend: jest.fn(),
            processTransactions: jest.fn(),
          },
        },
        {
          provide: CacheService, useValue: {
            get: jest.fn(),
            getOrSet: jest.fn(),
            batchGetAll: jest.fn(),
          },
        },
        {
          provide: GatewayService, useValue: { create: jest.fn() },
        },
        {
          provide: TransactionPriceService, useValue: { getTransactionPrice: jest.fn() },
        },
        {
          provide: TransactionActionService, useValue: { getTransactionAction: jest.fn() },
        },
        {
          provide: AssetsService, useValue: { getAllAccountAssets: jest.fn() },
        },
        {
          provide: ApiConfigService, useValue: { getMaiarIdUrl: jest.fn() },
        },
        {
          provide: UsernameService, useValue: { getUsernameForAddressRaw: jest.fn() },
        },
        {
          provide: ProtocolService, useValue: { getShardCount: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get<TransactionService>(TransactionService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
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
});
