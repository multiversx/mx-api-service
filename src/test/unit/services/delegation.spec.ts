import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DelegationService } from "src/endpoints/delegation/delegation.service";
import { Delegation } from "src/endpoints/delegation/entities/delegation";
import { Node } from "src/endpoints/nodes/entities/node";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";
import { NodeType } from "src/endpoints/nodes/entities/node.type";
import { NodeService } from "src/endpoints/nodes/node.service";
import { AccountDelegation } from "src/endpoints/stake/entities/account.delegation";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('Delegation Service', () => {
  let delegationService: DelegationService;
  let cachingService: CacheService;
  let vmQueryService: VmQueryService;
  let apiConfigService: ApiConfigService;
  let nodeService: NodeService;
  let apiService: ApiService;
  let mockDelegationRaw: Delegation;
  let mockNodes: Node[];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DelegationService,
        {
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            getDelegationManagerContractAddress: jest.fn(),
            getNetwork: jest.fn(),
            getDelegationUrl: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
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
      ],
    }).compile();

    delegationService = moduleRef.get<DelegationService>(DelegationService);
    vmQueryService = moduleRef.get<VmQueryService>(VmQueryService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    cachingService = moduleRef.get<CacheService>(CacheService);
    nodeService = moduleRef.get<NodeService>(NodeService);
    apiService = moduleRef.get<ApiService>(ApiService);

    mockDelegationRaw = {
      stake: '123',
      topUp: '456',
      locked: '789',
      minDelegation: '100',
    };

    mockNodes = [
      {
        bls: "00198be6aae517a382944cd5a97845857f3b122bb1edf1588d60ed421d32d16ea2767f359a0d714fae3a35c1b0cf4e1141d701d5d1d24160e49eeaebeab21e2f89a2b7c44f3a313383d542e69800cfb6e115406d3d8114b4044ef5a04acf0408",
        name: "ThePalmTreeNW122",
        version: "v1.4.8.1",
        rating: 100,
        tempRating: 100,
        ratingModifier: 1.2,
        shard: 2,
        type: NodeType.validator,
        status: NodeStatus.eligible,
        online: true,
        nonce: 13736658,
        instances: 1,
        owner: "erd1kz2kumr0clug4ht2ek0l4l9drvq3rne9lmkwrjf3qv2luyuuaj2szjwv0f",
        identity: "thepalmtreenw",
        provider: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
        stake: "1000",
        topUp: "1000",
        locked: "1000",
        leaderFailure: 0,
        leaderSuccess: 6,
        validatorFailure: 0,
        validatorIgnoredSignatures: 1,
        validatorSuccess: 286,
        position: 0,
        auctioned: undefined,
        auctionPosition: undefined,
        auctionQualified: undefined,
        auctionTopUp: undefined,
        isInDangerZone: undefined,
        fullHistory: undefined,
        issues: [],
        syncProgress: undefined,
        remainingUnBondPeriod: undefined,
        epochsLeft: undefined,
        qualifiedStake: '',
      },
    ];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDelegation', () => {
    it('should return delegation from cache if available', async () => {
      // eslint-disable-next-line require-await
      jest.spyOn(cachingService, 'getOrSet').mockImplementation(async () => mockDelegationRaw);

      const result = await delegationService.getDelegation();

      expect(cachingService.getOrSet).toHaveBeenCalledTimes(1);
      expect(vmQueryService.vmQuery).not.toHaveBeenCalled();
      expect(nodeService.getAllNodes).not.toHaveBeenCalled();
      expect(apiService.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockDelegationRaw);
    });
  });

  describe('getDelegationRaw', () => {
    it('should return the correct delegation', async () => {
      const expectedDelegation = {
        stake: '1000',
        topUp: '1000',
        locked: '2000',
        minDelegation: '55254700823955191970041559200',
      };

      jest.spyOn(delegationService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(['someBase64Config']);
      jest.spyOn(delegationService['nodeService'], 'getAllNodes').mockResolvedValueOnce(mockNodes);
      jest.spyOn(delegationService['apiConfigService'], 'getDelegationManagerContractAddress').mockReturnValue('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6');

      const result = await delegationService.getDelegationRaw();

      expect(result).toEqual(expectedDelegation);
    });

    it('should return the correct delegation with minDelegation: 0 because test simulate that the delegation contract manager is not defined', async () => {
      const expectedDelegation = {
        stake: '1000',
        topUp: '1000',
        locked: '2000',
        minDelegation: '0',
      };

      jest.spyOn(delegationService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(['someBase64Config']);
      jest.spyOn(delegationService['nodeService'], 'getAllNodes').mockResolvedValueOnce(mockNodes);

      const result = await delegationService.getDelegationRaw();

      expect(result).toEqual(expectedDelegation);
    });

    it('should return the correct delegation when there are no nodes', async () => {
      const expectedDelegation = {
        stake: '0',
        topUp: '0',
        locked: '0',
        minDelegation: '55254700823955191970041559200',
      };

      jest.spyOn(delegationService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(['someBase64Config']);
      jest.spyOn(delegationService['nodeService'], 'getAllNodes').mockResolvedValueOnce([]);
      jest.spyOn(delegationService['apiConfigService'], 'getDelegationManagerContractAddress').mockReturnValue('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6');

      const result = await delegationService.getDelegationRaw();

      expect(result).toEqual(expectedDelegation);
    });
  });

  describe('getDelegationForAddress', () => {
    const mockAddress = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';

    it('should return account delegation details for the given address', async () => {
      const mockResponse: AccountDelegation[] = [
        {
          address: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz',
          contract: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqq6nzrxnyhzer9lmudqhjgy7ycqjjyknz',
          userUnBondable: '1000000000000000000',
          userActiveStake: '0',
          claimableRewards: '0',
          userUndelegatedList: [],
        },
      ];
      const mockGetFn = jest.fn().mockResolvedValue({ data: mockResponse });
      jest.spyOn(apiService, 'get').mockImplementation(mockGetFn);

      const result = await delegationService.getDelegationForAddress(mockAddress);

      expect(result).toEqual(mockResponse);
      expect(mockGetFn).toHaveBeenCalledWith(`${apiConfigService.getDelegationUrl()}/accounts/${mockAddress}/delegations`);
    });

    it('should throw an error if the API call fails', async () => {
      const mockError = new Error('API error');
      const mockGetFn = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(apiService, 'get').mockImplementation(mockGetFn);
      jest.spyOn(delegationService['logger'], 'error').mockImplementation(() =>
        "Error when getting account delegation details for address erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz");

      await expect(delegationService.getDelegationForAddress(mockAddress)).rejects.toThrow(mockError);
      expect(mockGetFn).toHaveBeenCalledWith(`${apiConfigService.getDelegationUrl()}/accounts/${mockAddress}/delegations`);
    });
  });
});
