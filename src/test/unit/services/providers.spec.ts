import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('ProviderService', () => {
  let service: ProviderService;
  let vmQuery: VmQueryService;
  let apiService: ApiService;
  let elasticIndexerService: ElasticIndexerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProviderService,
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
            getRemote: jest.fn(),
            batchProcess: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getProvidersUrl: jest.fn(),
            getDelegationManagerContractAddress: jest.fn(),
            getDelegationContractAddress: jest.fn(),
          },
        },
        {
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: NodeService,
          useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: IdentitiesService,
          useValue: {
            getIdentityAvatar: jest.fn(),
            getIdentity: jest.fn(),
          },
        },
        {
          provide: ElasticIndexerService,
          useValue: {
            getProviderDelegators: jest.fn(),
            getProviderDelegatorsCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ProviderService>(ProviderService);
    vmQuery = moduleRef.get<VmQueryService>(VmQueryService);
    apiService = moduleRef.get<ApiService>(ApiService);
    elasticIndexerService = moduleRef.get<ElasticIndexerService>(ElasticIndexerService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCumulatedRewards', () => {
    it('should return total cumulated rewards for a given address', async () => {
      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue(['MTAwMA==']);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = await service.getCumulatedRewards(address);

      expect(result).toStrictEqual("825241648");
    });

    it('should return null if vmQuery returns empty array', async () => {
      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue([]);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = await service.getCumulatedRewards(address);

      expect(result).toBeNull();
    });
  });

  describe('getNumUsers', () => {
    it('should return total number of users for a given address', async () => {
      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue(['MTA=']);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = await service.getCumulatedRewards(address);

      expect(result).toStrictEqual("12592");
    });

    it('should return null if vmQuery returns empty array', async () => {
      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue([]);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const result = await service.getCumulatedRewards(address);

      expect(result).toBeNull();
    });
  });

  describe('getDelegationProviderByAddressRaw', () => {
    it('should return delegation data for a given address from delegation API', async () => {
      const mockDelegationData = {
        data: {
          identity: {
            key: 'stakingProviderTest',
            name: 'Staking Provider',
            avatar: 'https://avatars.githubusercontent.com/u/128509689?v=4',
            description: 'The smart way to manage your stakes',
            twitter: 'staking_provider',
            location: 'Sibiu',
            url: 'https://staking.provider',
          },
          contract: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
          explorerURL:
            'https://explorer.multiversx.com/providers/erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
          featured: true,
          owner: 'erd1yj4jlay9rrzahran7jxk89gsg9frxw6l5qyca9dqhp8c4f5e0vdsytwkvl',
          serviceFee: '1500',
          maxDelegationCap: '0',
          initialOwnerFunds: '1250000000000000000000',
          automaticActivation: false,
          withDelegationCap: false,
          changeableServiceFee: true,
          checkCapOnRedelegate: false,
          createdNonce: 3432672,
          unBondPeriod: 10,
          apr: '7.11',
          aprValue: 7.113629244616206,
          totalActiveStake: '777022672598356625999859',
          totalUnStaked: '26263960013713254383063',
          totalCumulatedRewards: '0',
          numUsers: 16639,
          numNodes: 183,
          maxDelegateAmountAllowed: '0',
          ownerBelowRequiredBalanceThreshold: false,
        },

      };
      jest.spyOn(apiService, 'get').mockResolvedValue(mockDelegationData);

      const result = await service.getDelegationProviderByAddressRaw(mockDelegationData.data.contract);

      expect(apiService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({
        identity: {
          key: 'stakingProviderTest',
          name: 'Staking Provider',
          avatar: 'https://avatars.githubusercontent.com/u/128509689?v=4',
          description: 'The smart way to manage your stakes',
          twitter: 'staking_provider',
          location: 'Sibiu',
          url: 'https://staking.provider',
        },
      }));
    });

    it('should return undefined if delegation API throw an error', async () => {
      jest.spyOn(apiService, 'get').mockRejectedValueOnce(new Error('Error when getting delegation provider'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        "Error when getting delegation provider");

      const address = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat';
      const result = await service.getDelegationProviderByAddressRaw(address);

      expect(result).toBeUndefined();
    });
  });

  describe('getProviderAddresses', () => {
    it('should return all contract addresses from delegation manager contract address', async () => {
      const base64Providers = [
        'AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAL///8=',
        'AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAP///8=',
      ];

      const expectedBech32Encoded = [
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhllllsajxzat',
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqlllllskf06ky',
      ];

      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue(base64Providers);

      const results = await service.getProviderAddresses();
      expect(results).toEqual(expectedBech32Encoded);
    });

    it('should return empty array if no contract addresses are returned from vmQuery', async () => {
      jest.spyOn(vmQuery, 'vmQuery').mockResolvedValue([]);
      jest.spyOn(apiService, 'get').mockRejectedValueOnce(new Error('Error when getting delegation providers'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        "Error when getting delegation providers");

      const results = await service.getProviderAddresses();
      expect(results).toEqual([]);
    });
  });

  describe('getProviderAccounts', () => {
    it('should return a list of delegators for a given provider', async () => {
      const contract = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu';
      const elasticProviderDelegatorsMock = createElasticMockDelegators(25, contract);
      jest.spyOn(elasticIndexerService, 'getProviderDelegators').mockResolvedValue(elasticProviderDelegatorsMock);

      const results = await service.getProviderAccounts(contract, new QueryPagination({}));
      expect(elasticIndexerService.getProviderDelegators).toHaveBeenCalled();

      for (const result of results) {
        expect(result.address).toBeDefined();
        expect(result.stake).toBeDefined();
      }
    });

    it('should return [] if no delegators are available from elastic from given contract address', async () => {
      const contract = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrhlllls062tu4';
      jest.spyOn(elasticIndexerService, 'getProviderDelegators').mockResolvedValue([]);

      const results = await service.getProviderAccounts(contract, new QueryPagination());

      expect(elasticIndexerService.getProviderDelegators).toHaveBeenCalled();
      expect(results).toStrictEqual([]);
    });
  });

  describe('getProviderAccountsCount', () => {
    it('should return total delegators count for a given provider', async () => {
      const contract = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu';
      jest.spyOn(elasticIndexerService, 'getProviderDelegatorsCount').mockResolvedValue(100);

      const results = await service.getProviderAccountsCount(contract);

      expect(elasticIndexerService.getProviderDelegatorsCount).toHaveBeenCalled();
      expect(results).toStrictEqual(100);
    });
  });
});

function createElasticMockDelegators(numberOfAccounts: number, contract: string | null) {
  return Array.from({ length: numberOfAccounts }, (_, index) => {

    return {
      contract: contract || generateMockAddress(),
      address: generateMockAddress(),
      activeStake: generateRandomBalance(),
      activeStakeNum: generateRandomBalance(),
      timestamp: Math.floor(Date.now() / 1000) - index * 1000,
    };
  });
}

function generateRandomBalance() {
  return (Math.floor(Math.random() * 1000000) + 100000).toString();
}

function generateMockAddress() {
  const desiredLength = 62 - 'erd1'.length;
  let address = 'erd1';

  while (address.length < desiredLength + 'erd1'.length) {
    address += Math.random().toString(36).substring(2);
  }

  return address.substring(0, desiredLength + 'erd1'.length);
}
