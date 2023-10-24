import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('ProviderService', () => {
  let service: ProviderService;
  let vmQuery: VmQueryService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProviderService,
        {
          provide: CacheService, useValue: {
            getOrSet: jest.fn(),
            getRemote: jest.fn(),
            batchProcess: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: ApiConfigService, useValue: {
            getProvidersUrl: jest.fn(),
            getDelegationManagerContractAddress: jest.fn(),
            getDelegationContractAddress: jest.fn(),
          },
        },
        {
          provide: VmQueryService, useValue: { vmQuery: jest.fn() },
        },
        {
          provide: NodeService, useValue: { getAllNodes: jest.fn() },
        },
        {
          provide: ApiService, useValue: { get: jest.fn() },
        },
        {
          provide: IdentitiesService, useValue: {
            getIdentityAvatar: jest.fn(),
            getIdentity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ProviderService>(ProviderService);
    vmQuery = moduleRef.get<VmQueryService>(VmQueryService);
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
});
