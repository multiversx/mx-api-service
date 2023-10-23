import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('Provider service', () => {
  let service: ProviderService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProviderService,
        {
          provide: CacheService, useValue: {
            getOrSet: jest.fn(),
            getRemote: jest.fn(),
            batchProcess: jest.fn(),
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
          provide: VmQueryService, useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: NodeService, useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: ApiService, useValue: {
            get: jest.fn(),
          },
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isProvider', () => {
    it('should verify if given address is provider', async () => {
    });
  });
});
