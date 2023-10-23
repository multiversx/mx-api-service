import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { DelegationLegacy } from "src/endpoints/delegation.legacy/entities/delegation.legacy";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { CacheInfo } from "src/utils/cache.info";

describe('DelegationLegacyService', () => {
  let delegationLegacyService: DelegationLegacyService;
  let apiConfigService: ApiConfigService;
  let cachingService: CacheService;
  let delegationLegacyMock: DelegationLegacy;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DelegationLegacyService,
        {
          provide: ApiConfigService,
          useValue: {
            getDelegationManagerContractAddress: jest.fn(),
            getDelegationContractAddress: jest.fn(),
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
          provide: VmQueryService,
          useValue: {
            vmQuery: jest.fn(),
          },
        },
      ],
    }).compile();

    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    cachingService = moduleRef.get<CacheService>(CacheService);

    delegationLegacyMock = {
      totalWithdrawOnlyStake: '100',
      totalWaitingStake: '100',
      totalActiveStake: '100',
      totalUnstakedStake: '100',
      totalDeferredPaymentStake: '100',
      numUsers: 6,
    };
  });

  describe('getDelegation', () => {
    it('should return the delegation information from cache', async () => {
      jest.spyOn(delegationLegacyService['cachingService'], 'getOrSet').mockResolvedValueOnce(delegationLegacyMock);

      const actualDelegation = await delegationLegacyService.getDelegation();

      expect(actualDelegation).toEqual(delegationLegacyMock);
      expect(cachingService.getOrSet).toHaveBeenCalledWith(
        CacheInfo.DelegationLegacy.key,
        expect.any(Function),
        CacheInfo.DelegationLegacy.ttl,
      );
    });

    it('should return the delegation information from raw data', async () => {
      jest.spyOn(delegationLegacyService['cachingService'], 'getOrSet').mockResolvedValueOnce(delegationLegacyMock);
      delegationLegacyService.getDelegationRaw = jest.fn().mockResolvedValueOnce(delegationLegacyMock);

      const actualDelegation = await delegationLegacyService.getDelegation();

      expect(actualDelegation).toEqual(delegationLegacyMock);
    });
  });

  describe('getDelegationRaw', () => {
    it('should return the correct delegation information', async () => {
      const totalStakeByTypeEncoded = [
        'FfOzpXIEVEgY',
        'A0h8j6oXB/ugrA==',
        'AoKvrf8o1lHgAAA=',
        '',
        'ET/LxR4lxvZR6w==',
      ];
      const numUsersEncoded = ['ia8='];

      jest.spyOn(delegationLegacyService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(totalStakeByTypeEncoded);
      jest.spyOn(delegationLegacyService['vmQueryService'], 'vmQuery').mockResolvedValueOnce(numUsersEncoded);

      (apiConfigService.getDelegationContractAddress as jest.Mock).mockReturnValueOnce('erd1');

      const actualDelegation = await delegationLegacyService.getDelegationRaw();

      expect(actualDelegation).toEqual(expect.objectContaining({
        totalWithdrawOnlyStake: '404942186829065766936',
        totalWaitingStake: '15504240601514290946220',
        totalActiveStake: '3034999999999999983222784',
        totalUnstakedStake: '0',
        totalDeferredPaymentStake: '81457058260735382409707',
        numUsers: 35247,
      }));
    });
  });
});
