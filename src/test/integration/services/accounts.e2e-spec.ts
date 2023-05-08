import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { ApiService, ApiUtils } from "@multiversx/sdk-nestjs-http";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountEsdtHistory } from "src/endpoints/accounts/entities/account.esdt.history";
import { AccountFilter } from "src/endpoints/accounts/entities/account.filter";
import { AccountHistory } from "src/endpoints/accounts/entities/account.history";
import { AccountHistoryFilter } from "src/endpoints/accounts/entities/account.history.filter";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { UsernameService } from "src/endpoints/usernames/username.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('Account Service', () => {
  let service: AccountService;
  let indexerService: IndexerService;
  let cacheService: CacheService;
  let apiService: ApiService;
  let apiConfigService: ApiConfigService;
  let transactionService: TransactionService;
  let transferService: TransferService;
  let smartContractResultService: SmartContractResultService;

  beforeEach((async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: IndexerService,
          useValue: {
            getAccount: jest.fn(),
            getAccounts: jest.fn(),
            getAccountsCount: jest.fn(),
            getAccountsForAddresses: jest.fn(),
            getAccountContracts: jest.fn(),
            getAccountContractsCount: jest.fn(),
            getAccountHistory: jest.fn(),
            getAccountTokenHistory: jest.fn(),
            getAccountHistoryCount: jest.fn(),
            getAccountTokenHistoryCount: jest.fn(),
            getScDeploy: jest.fn(),
            getTransaction: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getGuardianData: jest.fn(),
            getAddressDetails: jest.fn(),
            getNetworkStatus: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getVerifierUrl: jest.fn(),
            getIsIndexerV3FlagActive: jest.fn(),
            getDelegationContractAddress: jest.fn(),
            getAuctionContractAddress: jest.fn(),
            getStakingContractAddress: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            getTransactionCountForAddress: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue: {
            processAccount: jest.fn(),
          },
        },
        {
          provide: StakeService,
          useValue: {
            getAllStakesForNode: jest.fn(),
          },
        },
        {
          provide: TransferService,
          useValue: {
            getTransfersCount: jest.fn(),
          },
        },
        {
          provide: SmartContractResultService,
          useValue: {
            getAccountScResultsCount: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getAllAccountAssets: jest.fn(),
          },
        },
        {
          provide: UsernameService,
          useValue: {
            getUsernameForAddress: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ProtocolService,
          useValue: {
            getShardCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<AccountService>(AccountService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    cacheService = moduleRef.get<CacheService>(CacheService);
    apiService = moduleRef.get<ApiService>(ApiService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    transactionService = moduleRef.get<TransactionService>(TransactionService);
    transferService = moduleRef.get<TransferService>(TransferService);
    smartContractResultService = moduleRef.get<SmartContractResultService>(SmartContractResultService);
  }));

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccountsCount', () => {
    it('should call cachingService.getOrSet if filter.ownerAddress is not provided', async () => {
      const filter: AccountFilter = { ownerAddress: undefined };
      const expectedResult = 5;

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedResult);
      jest.spyOn(indexerService, 'getAccountsCount').mockResolvedValue(expectedResult);

      const result = await service.getAccountsCount(filter);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(indexerService.getAccountsCount).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should call indexerService.getAccountsCount directly if filter.ownerAddress is provided', async () => {
      const filter = { ownerAddress: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' };
      const expectedResult = 10;

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedResult);
      jest.spyOn(indexerService, 'getAccountsCount').mockResolvedValue(expectedResult);

      const result = await service.getAccountsCount(filter);

      expect(cacheService.getOrSet).not.toHaveBeenCalled();
      expect(indexerService.getAccountsCount).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAccountVerification', () => {
    it('should return null if the address is not valid', async () => {
      const address = 'invalid_address';

      jest.spyOn(AddressUtils, 'isAddressValid').mockReturnValue(false);

      const result = await service.getAccountVerification(address);

      expect(result).toBeNull();
    });

    it('should return verification data if the address is valid', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const verifierUrl = 'https://play-api.multiversx.com';
      const verificationData = { verified: true };

      jest.spyOn(AddressUtils, 'isAddressValid').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'getVerifierUrl').mockReturnValue(verifierUrl);
      jest.spyOn(apiService, 'get').mockResolvedValue({ data: verificationData });

      const result = await service.getAccountVerification(address);

      expect(apiService.get).toHaveBeenCalledWith(`${verifierUrl}/verifier/${address}`);
      expect(result).toEqual(verificationData);
    });
  });

  describe('getAccountSimple', () => {
    it('should return null if the address is not valid', async () => {
      const address = 'invalid_address';

      jest.spyOn(AddressUtils, 'isAddressValid').mockReturnValue(false);

      const result = await service.getAccountSimple(address);

      expect(result).toBeNull();
    });

    it('should return account data if the address is valid', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const accountData: AccountDetailed = {
        address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        balance: '162486906126924046',
        nonce: 45,
        timestamp: 0,
        shard: 0,
        ownerAddress: '',
        assets: undefined,
        code: '',
        codeHash: "",
        rootHash: 'w4fUiW+zHBmft9XlGbzVfcfn3rMtWKwi4bF+cjPPZ2k=',
        txCount: 0,
        scrCount: 0,
        username: 'alice.elrond',
        developerReward: '0',
        isPayableBySmartContract: undefined,
        scamInfo: undefined,
        nftCollections: undefined,
        nfts: undefined,
      };

      jest.spyOn(AddressUtils, 'isAddressValid').mockReturnValue(true);
      jest.spyOn(service, 'getAccountRaw').mockResolvedValue(accountData);

      const result = await service.getAccountSimple(address);

      expect(service.getAccountRaw).toHaveBeenCalledWith(address);
      expect(result).toEqual(accountData);
    });
  });

  describe('getAccountTxCount', () => {
    it('should return account transactions count from transaction service if indexer-v3 is false', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const expectedTxCount = 100;

      jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(false);
      jest.spyOn(transactionService, 'getTransactionCountForAddress').mockResolvedValue(expectedTxCount);

      const result = await service.getAccountTxCount(address);

      expect(transactionService.getTransactionCountForAddress).toHaveBeenCalledWith(address);
      expect(transferService.getTransfersCount).not.toHaveBeenCalled();
      expect(result).toStrictEqual(expectedTxCount);
    });

    it('should return account transactions count from transfer service if indexer-v3 is true', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const expectedTxCount = 100;

      jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(true);
      jest.spyOn(transferService, 'getTransfersCount').mockResolvedValue(expectedTxCount);

      const result = await service.getAccountTxCount(address);

      expect(transferService.getTransfersCount).toHaveBeenCalledWith(new TransactionFilter(
        { address: address, functions: [], receivers: [], senders: [], type: TransactionType.Transaction }));

      expect(transactionService.getTransactionCountForAddress).not.toHaveBeenCalled();
      expect(result).toStrictEqual(expectedTxCount);
    });
  });

  describe('getAccountScResults', () => {
    it('should return account smart contract results from smartContractResult service if indexer-v3 is false',
      async () => {
        const address = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
        const expectedTxCount = 100;

        jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(false);
        jest.spyOn(smartContractResultService, 'getAccountScResultsCount').mockResolvedValue(expectedTxCount);

        const result = await service.getAccountScResults(address);

        expect(smartContractResultService.getAccountScResultsCount).toHaveBeenCalledWith(address);
        expect(transferService.getTransfersCount).not.toHaveBeenCalled();
        expect(result).toStrictEqual(expectedTxCount);
      });

    it('should return account smart contract results from transfer service if indexer-v3 is true',
      async () => {
        const address = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
        const expectedTxCount = 100;

        jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(true);
        jest.spyOn(transferService, 'getTransfersCount').mockResolvedValue(expectedTxCount);

        const result = await service.getAccountScResults(address);

        expect(transferService.getTransfersCount).toHaveBeenCalledWith(new TransactionFilter(
          { address: address, functions: [], receivers: [], senders: [], type: TransactionType.SmartContractResult }));

        expect(smartContractResultService.getAccountScResultsCount).not.toHaveBeenCalledWith(address);
        expect(result).toStrictEqual(expectedTxCount);
      });
  });

  describe('getAccountDeployedAt', () => {
    it('should call cachingService.getOrSet with the correct key and TTL', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const expectedResult = 1620000000;

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedResult);
      jest.spyOn(service, 'getAccountDeployedAtRaw').mockResolvedValue(expectedResult);

      const result = await service.getAccountDeployedAt(address);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAccountDeployedAtRaw', () => {
    it('should return null if no scDeploy is found', async () => {
      const address = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(undefined);

      const result = await service.getAccountDeployedAtRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(result).toEqual(null);
    });

    it('should return null if no deployTxHash is found', async () => {
      const address = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(
        Promise.resolve({ deployTxHash: '', address: address, contract: address, deployer: address, timestamp: 1620000000, upgrades: [] }));

      const result = await service.getAccountDeployedAtRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(result).toBeNull();
    });

    it('should return the timestamp if scDeploy, deployTxHash, and transaction are found', async () => {
      const address = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';
      const txHash = "ca7acccc20a07695ba5657aac9c6e97b50fdcc9a77763447b9003721812271c7";
      const timestamp = 1620000000;

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(
        Promise.resolve({ deployTxHash: txHash, address: address, contract: address, deployer: address, timestamp: 1620000000, upgrades: [] }));

      jest.spyOn(indexerService, 'getTransaction').mockResolvedValue({
        hash: 'ca7acccc20a07695ba5657aac9c6e97b50fdcc9a77763447b9003721812271c7',
        miniBlockHash: '',
        nonce: 100,
        round: 100,
        value: "100000",
        receiver: '',
        sender: '',
        receiverShard: 1,
        senderShard: 2,
        gasPrice: '20000',
        gasLimit: '20000',
        gasUsed: '20000',
        fee: '100',
        data: '',
        signature: '',
        timestamp: 1620000000,
        status: 'success',
        searchOrder: 1,
        hasScResults: true,
        hasOperations: true,
        tokens: [],
        esdtValues: [],
        receivers: [],
        receiversShardIDs: [],
        operation: '',
        scResults: [],
      });

      const result = await service.getAccountDeployedAtRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(indexerService.getTransaction).toHaveBeenCalledWith(txHash);
      expect(result).toEqual(timestamp);
    });

    it('should return null if transaction is not found', async () => {
      const address = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';
      const txHash = "invalid-tx";

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(
        Promise.resolve({ deployTxHash: txHash, address: address, contract: address, deployer: address, timestamp: 1620000000, upgrades: [] }));
      jest.spyOn(indexerService, 'getTransaction').mockResolvedValue(null);

      const result = await service.getAccountDeployedAtRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(indexerService.getTransaction).toHaveBeenCalledWith(txHash);
      expect(result).toBeNull();
    });
  });

  describe('getAccountDeployedTxHash', () => {
    it('should call cachingService.getOrSet with the correct key and TTL', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const expectedResult = '1620000000';

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedResult);
      jest.spyOn(service, 'getAccountDeployedTxHashRaw').mockResolvedValue(expectedResult);

      const result = await service.getAccountDeployedTxHash(address);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAccountDeployedTxHashRaw', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const txHash = 'ca7acccc20a07695ba5657aac9c6e97b50fdcc9a77763447b9003721812271c7';

    it('should return null if no scDeploy is found', async () => {
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(undefined);

      const result = await service.getAccountDeployedTxHashRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(result).toBeNull();
    });

    it('should return account deployed txhash value', async () => {
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(
        Promise.resolve({
          deployTxHash: txHash,
          address: address, contract: address, deployer: address, timestamp: 1620000000, upgrades: [],
        }));

      const result = await service.getAccountDeployedTxHashRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(result).toStrictEqual(txHash);
    });
  });

  describe('getAccountIsVerified', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const codeHash = 'ca7acccc20a07695ba5657aac9c6e97b50fdcc9a77763447b9003721812271c7';

    it('should call cachingService.getOrSet', async () => {
      const getAccountIsVerifiedRawSpy = jest.spyOn(service, 'getAccountIsVerifiedRaw').mockResolvedValue(true);

      // eslint-disable-next-line require-await
      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_, callback) => callback());

      await service.getAccountIsVerified(address, codeHash);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(getAccountIsVerifiedRawSpy).toHaveBeenCalledWith(address, codeHash);
    });
  });

  describe('getAccountIsVerifiedRaw', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const codeHash = 'ca7acccc20a07695ba5657aac9c6e97b50fdcc9a77763447b9003721812271c7';
    const verifierUrl = 'https://play-api.multiversx.com';

    beforeEach(() => {
      jest.spyOn(apiConfigService, 'getVerifierUrl').mockReturnValue(verifierUrl);
    });

    it('should return true if codeHash matches', async () => {
      const data = { codeHash: Buffer.from(codeHash, 'base64').toString('hex') };
      jest.spyOn(apiService, 'get').mockResolvedValue({ data });

      const result = await service.getAccountIsVerifiedRaw(address, codeHash);

      expect(apiService.get).toHaveBeenCalledWith(`${verifierUrl}/verifier/${address}/codehash`, undefined, expect.any(Function));
      expect(result).toBe(true);
    });

    it('should return null if codeHash does not match', async () => {
      const data = { codeHash: 'differentCodeHash' };
      jest.spyOn(apiService, 'get').mockResolvedValue({ data });

      const result = await service.getAccountIsVerifiedRaw(address, codeHash);

      expect(apiService.get).toHaveBeenCalledWith(`${verifierUrl}/verifier/${address}/codehash`, undefined, expect.any(Function));
      expect(result).toBe(null);
    });

    it('should return null if an error occurs', async () => {
      jest.spyOn(apiService, 'get').mockRejectedValue(new Error('Test error'));

      const result = await service.getAccountIsVerifiedRaw(address, codeHash);

      expect(apiService.get).toHaveBeenCalledWith(`${verifierUrl}/verifier/${address}/codehash`, undefined, expect.any(Function));
      expect(result).toBe(null);
    });
  });

  describe('getAccountContractsCount', () => {
    it('should return the number of contracts', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const contractsCount = 5;

      jest.spyOn(indexerService, 'getAccountContractsCount').mockResolvedValue(contractsCount);

      const result = await service.getAccountContractsCount(address);

      expect(indexerService.getAccountContractsCount).toHaveBeenCalledWith(address);
      expect(result).toEqual(contractsCount);
    });
  });

  describe('getAccountHistoryCount', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const filter = new AccountHistoryFilter({});
    const historyCount = 10;

    it('should return the account history count', async () => {
      jest.spyOn(indexerService, 'getAccountHistoryCount').mockResolvedValue(historyCount);

      const result = await service.getAccountHistoryCount(address, filter);

      expect(indexerService.getAccountHistoryCount).toHaveBeenCalledWith(address, filter);
      expect(result).toEqual(historyCount);
    });
  });

  describe('getAccountTokenHistoryCount', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const tokenIdentifier = 'WEGLD-bd4d79';
    const filter = new AccountHistoryFilter({});
    const tokenHistoryCount = 5;

    it('should return the account token history count', async () => {
      jest.spyOn(indexerService, 'getAccountTokenHistoryCount').mockResolvedValue(tokenHistoryCount);

      const result = await service.getAccountTokenHistoryCount(address, tokenIdentifier, filter);

      expect(indexerService.getAccountTokenHistoryCount).toHaveBeenCalledWith(address, tokenIdentifier, filter);
      expect(result).toEqual(tokenHistoryCount);
    });
  });

  describe('getAccountHistory', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const pagination = { from: 0, size: 10 };
    const filter = new AccountHistoryFilter({});

    const elasticResult = [
      {
        address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        timestamp: 1671354534,
        balance: '162486906126924046',
      },
      {
        address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        timestamp: 1671354486,
        balance: '162363149176924046',
      },
    ];

    it('should return the account history', async () => {
      jest.spyOn(indexerService, 'getAccountHistory').mockResolvedValue(elasticResult);

      const result = await service.getAccountHistory(address, pagination, filter);

      expect(indexerService.getAccountHistory).toHaveBeenCalledWith(address, pagination, filter);

      const expectedResult = elasticResult.map(item => ApiUtils.mergeObjects(new AccountHistory(), item));
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAccountTokenHistory', () => {
    const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
    const token = 'WEGLD-bd4d79';
    const pagination = { from: 0, size: 10 };
    const filter = new AccountHistoryFilter({});

    const elasticResult = [
      {
        address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        timestamp: 1640603532,
        balance: '0',
        token: 'WEGLD-bd4d79',
        identifier: 'WEGLD-bd4d79',
        tokenNonce: 10,
        isSender: true,
        shardID: 0,
        isSmartContract: false,
      },
      {
        address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
        timestamp: 1640603532,
        balance: '0',
        token: 'WEGLD-bd4d79',
        identifier: 'WEGLD-bd4d79',
        tokenNonce: 10,
        isSender: true,
        shardID: 0,
        isSmartContract: false,
      },
    ];

    it('should return the account history for a specific token', async () => {
      jest.spyOn(indexerService, 'getAccountTokenHistory').mockResolvedValue(elasticResult);

      const result = await service.getAccountTokenHistory(address, token, pagination, filter);

      expect(indexerService.getAccountTokenHistory).toHaveBeenCalledWith(address, token, pagination, filter);

      const expectedResult = elasticResult.map(item => ApiUtils.mergeObjects(new AccountEsdtHistory(), item));
      expect(result).toEqual(expectedResult);
    });
  });
});
