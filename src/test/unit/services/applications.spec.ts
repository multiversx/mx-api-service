import { Test, TestingModule } from '@nestjs/testing';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';
import { ApplicationFilter, UsersCountRange } from 'src/endpoints/applications/entities/application.filter';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { ApplicationsService } from 'src/endpoints/applications/applications.service';
import { Applications } from 'src/endpoints/applications/entities/applications';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let indexerService: ElasticIndexerService;
  let gatewayService: GatewayService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: ElasticIndexerService,
          useValue: {
            getApplications: jest.fn(),
            getApplicationCount: jest.fn(),
            getApplication: jest.fn(),
            getScDeploy: jest.fn(),
            getTransaction: jest.fn(),
            getApplicationUsersCount: jest.fn(),
            getApplicationFeesCaptured: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getAddressDetails: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    indexerService = module.get<ElasticIndexerService>(ElasticIndexerService);
    gatewayService = module.get<GatewayService>(GatewayService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApplications', () => {
    it('should return an array of applications with enriched data', async () => {
      const indexResult = [
        {
          address: 'erd1qqqqqqqqqqqqqpgq8372f63glekg7zl22tmx7wzp4drql25r6avs70dmp0',
          balance: '1000000000000000000',
          api_isVerified: true,
          api_transfersLast24h: 100,
          api_assets: { name: 'Test App', icon: 'test.png' },
        },
        {
          address: 'erd1qqqqqqqqqqqqqpgquc4v0pujmewzr26tm2gtawmsq4vsrm4mwmfs459g65',
          balance: '2000000000000000000',
          api_isVerified: false,
          api_transfersLast24h: 50,
          api_assets: null,
        },
      ];

      const scDeployData = {
        deployTxHash: '0x1234567890abcdef',
      };

      const transactionData = {
        timestamp: 1724955216,
      };

      jest.spyOn(indexerService, 'getApplications').mockResolvedValue(indexResult);
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(scDeployData);
      jest.spyOn(indexerService, 'getTransaction').mockResolvedValue(transactionData);
      jest.spyOn(indexerService, 'getApplicationUsersCount').mockResolvedValue(10);
      jest.spyOn(indexerService, 'getApplicationFeesCaptured').mockResolvedValue('500000000000000000');
      jest.spyOn(gatewayService, 'getAddressDetails').mockResolvedValue({
        account: {
          address: '',
          nonce: 0,
          balance: '0',
          username: '',
          code: '',
          codeHash: '',
          rootHash: '',
          codeMetadata: '',
          developerReward: '1000000000000000',
          ownerAddress: '',
        },
      });

      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter();
      const result = await service.getApplicationsRaw(queryPagination, filter);

      expect(indexerService.getApplications).toHaveBeenCalledWith(filter, queryPagination);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        address: indexResult[0].address,
        balance: indexResult[0].balance,
        isVerified: true,
        txCount: 100,
        usersCount: 10,
        feesCaptured: '500000000000000000',
        deployedAt: 1724955216,
        deployTxHash: '0x1234567890abcdef',
        developerReward: '1000000000000000',
      });
    });

    it('should return cached applications when filter is not set', async () => {
      const cachedApplications = [
        new Applications({
          address: 'erd1test',
          balance: '1000',
          usersCount: 5,
          feesCaptured: '100',
          deployedAt: 123456,
          deployTxHash: '0xtest',
          isVerified: true,
          txCount: 10,
          developerReward: '50',
        }),
      ];

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(cachedApplications);

      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter();
      const result = await service.getApplications(queryPagination, filter);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(cachedApplications);
    });

    it('should bypass cache when filter is set', async () => {
      const indexResult = [{
        address: 'erd1test',
        balance: '1000',
        api_isVerified: false,
        api_transfersLast24h: 5,
        api_assets: null,
      }];

      jest.spyOn(indexerService, 'getApplications').mockResolvedValue(indexResult);
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(null);
      jest.spyOn(indexerService, 'getApplicationUsersCount').mockResolvedValue(0);
      jest.spyOn(indexerService, 'getApplicationFeesCaptured').mockResolvedValue('0');
      jest.spyOn(gatewayService, 'getAddressDetails').mockResolvedValue({
        account: {
          address: '',
          nonce: 0,
          balance: '0',
          username: '',
          code: '',
          codeHash: '',
          rootHash: '',
          codeMetadata: '',
          developerReward: '0',
          ownerAddress: '',
        },
      });

      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter({ isVerified: true });
      const result = await service.getApplications(queryPagination, filter);

      expect(indexerService.getApplications).toHaveBeenCalledWith(filter, queryPagination);
      expect(result).toHaveLength(1);
    });

    it('should handle errors in enrichment gracefully', async () => {
      const indexResult = [{
        address: 'erd1test',
        balance: '1000',
        api_isVerified: false,
        api_transfersLast24h: 5,
        api_assets: null,
      }];

      jest.spyOn(indexerService, 'getApplications').mockResolvedValue(indexResult);
      jest.spyOn(indexerService, 'getScDeploy').mockRejectedValue(new Error('Test error'));
      jest.spyOn(indexerService, 'getApplicationUsersCount').mockRejectedValue(new Error('Test error'));
      jest.spyOn(indexerService, 'getApplicationFeesCaptured').mockRejectedValue(new Error('Test error'));
      jest.spyOn(gatewayService, 'getAddressDetails').mockRejectedValue(new Error('Test error'));

      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter();
      const result = await service.getApplicationsRaw(queryPagination, filter);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: 'erd1test',
        balance: '1000',
        usersCount: 0,
        feesCaptured: '0',
        deployedAt: 0,
        deployTxHash: '',
        developerReward: '',
      });
    });
  });

  describe('getApplicationsCount', () => {
    it('should return total applications count', async () => {
      jest.spyOn(indexerService, 'getApplicationCount').mockResolvedValue(2);

      const filter = new ApplicationFilter();
      const result = await service.getApplicationsCount(filter);

      expect(indexerService.getApplicationCount).toHaveBeenCalledWith(filter);
      expect(indexerService.getApplicationCount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(2);
    });
  });

  describe('getApplication', () => {
    it('should return a single application with enriched data', async () => {
      const address = 'erd1qqqqqqqqqqqqqpgq8372f63glekg7zl22tmx7wzp4drql25r6avs70dmp0';
      const indexResult = {
        address,
        balance: '1000000000000000000',
        api_isVerified: true,
        api_transfersLast24h: 100,
        api_assets: { name: 'Test App', icon: 'test.png' },
      };

      const scDeployData = { deployTxHash: '0x1234567890abcdef' };
      const transactionData = { timestamp: 1724955216 };

      jest.spyOn(indexerService, 'getApplication').mockResolvedValue(indexResult);
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(scDeployData);
      jest.spyOn(indexerService, 'getTransaction').mockResolvedValue(transactionData);
      jest.spyOn(indexerService, 'getApplicationUsersCount').mockResolvedValue(10);
      jest.spyOn(indexerService, 'getApplicationFeesCaptured').mockResolvedValue('500000000000000000');
      jest.spyOn(gatewayService, 'getAddressDetails').mockResolvedValue({
        account: {
          address: '',
          nonce: 0,
          balance: '0',
          username: '',
          code: '',
          codeHash: '',
          rootHash: '',
          codeMetadata: '',
          developerReward: '1000000000000000',
          ownerAddress: '',
        },
      });

      const result = await service.getApplication(address, UsersCountRange._7d, UsersCountRange._30d);

      expect(indexerService.getApplication).toHaveBeenCalledWith(address);
      expect(result).toMatchObject({
        address,
        balance: indexResult.balance,
        isVerified: true,
        txCount: 100,
        usersCount: 10,
        feesCaptured: '500000000000000000',
        deployedAt: 1724955216,
        deployTxHash: '0x1234567890abcdef',
        developerReward: '1000000000000000',
      });
    });
  });

  describe('getApplicationUsersCount', () => {
    it('should return cached users count when available', async () => {
      const address = 'erd1test';
      const range = UsersCountRange._24h;
      const expectedCount = 100;

      jest.spyOn(cacheService, 'get').mockResolvedValue(expectedCount);

      const result = await service.getApplicationUsersCount(address, range);

      expect(cacheService.get).toHaveBeenCalled();
      expect(result).toBe(expectedCount);
    });

    it('should fallback to elastic service when not cached', async () => {
      const address = 'erd1test';
      const range = UsersCountRange._7d;
      const expectedCount = 50;

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(indexerService, 'getApplicationUsersCount').mockResolvedValue(expectedCount);

      const result = await service.getApplicationUsersCount(address, range);

      expect(cacheService.get).toHaveBeenCalled();
      expect(indexerService.getApplicationUsersCount).toHaveBeenCalledWith(address, range);
      expect(result).toBe(expectedCount);
    });
  });

  describe('getApplicationFeesCaptured', () => {
    it('should return cached fees when available', async () => {
      const address = 'erd1test';
      const range = UsersCountRange._24h;
      const expectedFees = '1000000000000000000';

      jest.spyOn(cacheService, 'get').mockResolvedValue(expectedFees);

      const result = await service.getApplicationFeesCaptured(address, range);

      expect(cacheService.get).toHaveBeenCalled();
      expect(result).toBe(expectedFees);
    });

    it('should fallback to elastic service when not cached', async () => {
      const address = 'erd1test';
      const range = UsersCountRange._30d;
      const expectedFees = '2000000000000000000';

      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(indexerService, 'getApplicationFeesCaptured').mockResolvedValue(expectedFees);

      const result = await service.getApplicationFeesCaptured(address, range);

      expect(cacheService.get).toHaveBeenCalled();
      expect(indexerService.getApplicationFeesCaptured).toHaveBeenCalledWith(address, range);
      expect(result).toBe(expectedFees);
    });
  });

  describe('getAccountDeployedAt', () => {
    it('should return cached deployment timestamp', async () => {
      const address = 'erd1test';
      const expectedTimestamp = 1724955216;

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedTimestamp);

      const result = await service.getAccountDeployedAt(address);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toBe(expectedTimestamp);
    });

    it('should return null when deployment data not found', async () => {
      const address = 'erd1test';

      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fetcher) => {
        return await fetcher();
      });
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(null);

      const result = await service.getAccountDeployedAt(address);

      expect(result).toBe(null);
    });
  });

  describe('getAccountDeployedTxHash', () => {
    it('should return cached deployment transaction hash', async () => {
      const address = 'erd1test';
      const expectedHash = '0x1234567890abcdef';

      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue(expectedHash);

      const result = await service.getAccountDeployedTxHash(address);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toBe(expectedHash);
    });

    it('should return null when deployment data not found', async () => {
      const address = 'erd1test';

      jest.spyOn(cacheService, 'getOrSet').mockImplementation(async (_key, fetcher) => {
        return await fetcher();
      });
      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(null);

      const result = await service.getAccountDeployedTxHash(address);

      expect(result).toBe(null);
    });
  });

  describe('getAccountDeployedAtRaw', () => {
    it('should return deployment timestamp without caching', async () => {
      const address = 'erd1test';
      const scDeployData = { deployTxHash: '0x1234567890abcdef' };
      const transactionData = { timestamp: 1724955216 };

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(scDeployData);
      jest.spyOn(indexerService, 'getTransaction').mockResolvedValue(transactionData);

      const result = await service.getAccountDeployedAtRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(indexerService.getTransaction).toHaveBeenCalledWith('0x1234567890abcdef');
      expect(result).toBe(1724955216);
    });
  });

  describe('getAccountDeployedTxHashRaw', () => {
    it('should return deployment transaction hash without caching', async () => {
      const address = 'erd1test';
      const scDeployData = { deployTxHash: '0x1234567890abcdef' };

      jest.spyOn(indexerService, 'getScDeploy').mockResolvedValue(scDeployData);

      const result = await service.getAccountDeployedTxHashRaw(address);

      expect(indexerService.getScDeploy).toHaveBeenCalledWith(address);
      expect(result).toBe('0x1234567890abcdef');
    });
  });
});
