import { Test } from "@nestjs/testing";
import { AssetsService } from "src/common/assets/assets.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { IndexerService } from "src/common/indexer/indexer.service";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { TransactionActionService } from "src/endpoints/transactions/transaction-action/transaction.action.service";

describe('TagService', () => {
  let service: SmartContractResultService;
  let indexerService: IndexerService;
  let transactionActionService: TransactionActionService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SmartContractResultService,
        {
          provide: IndexerService,
          useValue: {
            getScResults: jest.fn(),
            getScResult: jest.fn(),
            getScResultsCount: jest.fn(),
            getAccountScResults: jest.fn(),
            getAccountScResultsCount: jest.fn(),
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
      ],
    }).compile();

    service = moduleRef.get<SmartContractResultService>(SmartContractResultService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    transactionActionService = moduleRef.get<TransactionActionService>(TransactionActionService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccountScResultsCount', () => {
    it('should return account smart contract results count', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      jest.spyOn(indexerService, 'getAccountScResultsCount').mockResolvedValue(256);

      const result = await service.getAccountScResultsCount(address);

      expect(result).toStrictEqual(256);
      expect(indexerService.getAccountScResultsCount).toHaveBeenCalledWith(address);
      expect(indexerService.getAccountScResultsCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScResultsCount', () => {
    it('should return total smart contracts count', async () => {
      jest.spyOn(indexerService, 'getScResultsCount').mockResolvedValue(10000);

      const result = await service.getScResultsCount(new SmartContractResultFilter);

      expect(result).toStrictEqual(10000);
      expect(indexerService.getScResultsCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getScResult', () => {
    it('should return smart contract details for a given smart contract hash', async () => {
      const scHash = '3eda9575e66505051f8603b40489781b221d709d9ac23ab8e13d0234eddea781';
      const mockIndexerScResult = {
        scHash: '3eda9575e66505051f8603b40489781b221d709d9ac23ab8e13d0234eddea781',
        nonce: 0,
        gasLimit: '0',
        gasPrice: '1000000000',
        value: '0',
        sender: 'erd1qqqqqqqqqqqqqpgql6dxenaameqn2uyyru3nmmpf7e95zmlxu7zskzpdcw',
        receiver: 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax',
        senderShard: 1,
        receiverShard: 1,
        data: 'RVNEVFRyYW5zZmVyQDQ4NTk1MDQ1MmQzNjMxMzkzNjM2MzFAOGIzYzVhNDFhMDRhNjliMjdm',
        prevTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
        originalTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
        callType: '0',
        timestamp: 1678983282,
        tokens: ['HYPE-619661'],
        esdtValues: ['2568446286792506323583'],
        operation: 'ESDTTransfer',
      };

      jest.spyOn(indexerService, 'getScResult').mockResolvedValue(mockIndexerScResult);
      jest.spyOn(transactionActionService, 'getTransactionAction').mockResolvedValue({
        category: 'esdtNft',
        name: 'transfer',
        description: 'Transfer',
        arguments: {
          transfers: [[Object]],
          receiver: 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax',
          functionName: undefined,
          functionArgs: [],
        },
      });

      const result = await service.getScResult(scHash);

      expect(result).toBeInstanceOf(SmartContractResult);
      expect(indexerService.getScResult).toHaveBeenCalledWith(scHash);
      expect(indexerService.getScResult).toHaveBeenCalledTimes(1);
      expect(transactionActionService.getTransactionAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAccountScResults', () => {
    const mockIndexerScResults = [{
      scHash: 'f9a553996e7d3cde70d99212eb2462e209df721db324fdc72139626746369883',
      nonce: 0,
      gasLimit: '0',
      gasPrice: '1000000000',
      value: '0',
      sender: 'erd1qqqqqqqqqqqqqpgql6dxenaameqn2uyyru3nmmpf7e95zmlxu7zskzpdcw',
      receiver: 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax',
      senderShard: 1,
      receiverShard: 1,
      data: 'RVNEVFRyYW5zZmVyQDQ4NTk1MDQ1MmQzNjMxMzkzNjM2MzFAOGIzYzVhNDFhMDRhNjliMjdm',
      prevTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
      originalTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
      callType: '0',
      timestamp: 1678983282,
      tokens: ['HYPE-619661'],
      esdtValues: ['1000000000000000000'],
      operation: 'ESDTTransfer',
    },
    {
      scHash: '6fc7c94e6fd113fd073e513d7e4f04d25bcbc4fefed8eea65748d18ed15b270d',
      nonce: 0,
      gasLimit: '0',
      gasPrice: '1000000000',
      value: '0',
      sender: 'erd1qqqqqqqqqqqqqpgql6dxenaameqn2uyyru3nmmpf7e95zmlxu7zskzpdcw',
      receiver: 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax',
      senderShard: 1,
      receiverShard: 1,
      data: 'RVNEVFRyYW5zZmVyQDQ4NTk1MDQ1MmQzNjMxMzkzNjM2MzFAOGIzYzVhNDFhMDRhNjliMjdm',
      prevTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
      originalTxHash: 'f708864d802799353743f8703bffc87fa8167e46a522eb973fdfadedaa2bc9e0',
      callType: '0',
      timestamp: 1678983282,
      tokens: ['HYPE-619661'],
      esdtValues: ['123416452926529462'],
      operation: 'ESDTTransfer',
    }];

    const mockTransactionAction = {
      category: 'esdtNft',
      name: 'transfer',
      description: 'Transfer',
      arguments: {
        transfers: [{
          category: "scCall",
          name: "esdtTransfer",
        }],
        receiver: 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax',
        functionName: undefined,
        functionArgs: [],
      },
    };

    it('should return account smart contract results', async () => {
      const address = 'erd1ahauxqcaxvcksrcyyxzk5lrr3p8p8rjtayfue068nktrpjpvzers3dgvax';

      jest.spyOn(indexerService, 'getAccountScResults').mockResolvedValue(mockIndexerScResults);
      jest.spyOn(transactionActionService, 'getTransactionAction').mockResolvedValue(mockTransactionAction);

      const results = await service.getAccountScResults(address, new QueryPagination());

      for (const result of results) {
        expect(result).toBeInstanceOf(SmartContractResult);
        expect(indexerService.getAccountScResults).toHaveBeenCalledTimes(1);
        expect(transactionActionService.getTransactionAction).toHaveBeenCalledTimes(2);
      }
    });
  });
});
