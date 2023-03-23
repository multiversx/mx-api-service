import { ApiService, CachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { NetworkService } from "src/endpoints/network/network.service";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('NetworkService', () => {
  let networkService: NetworkService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NetworkService,
        {
          provide: TokenService, useValue: {
            getTokenMarketCapRaw: jest.fn(),
          },
        },
        {
          provide: CachingService, useValue:
          {
            getOrSetCache: jest.fn(),
          },
        },
        {
          provide: ApiConfigService, useValue:
          {
            getNetwork: jest.fn(),
            getCluster: jest.fn(),
            getInflationAmounts: jest.fn(),
            isStakingV4Enabled: jest.fn(),
            getMetaChainShardId: jest.fn(),
            getAuctionContractAddress: jest.fn(),
            getDelegationContractAddress: jest.fn(),
          },
        },
        {
          provide: GatewayService, useValue:
          {
            getNetworkConfig: jest.fn(),
            getNetworkStatus: jest.fn(),
            getValidatorAuctions: jest.fn(),
            getAddressDetails: jest.fn(),
            getNetworkEconomics: jest.fn(),
          },
        },
        {
          provide: VmQueryService, useValue:
          {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: BlockService, useValue:
          {
            getBlocksCount: jest.fn(),
          },
        },
        {
          provide: AccountService, useValue:
          {
            getAccountRaw: jest.fn(),
            getAccountsCount: jest.fn(),
          },
        },
        {
          provide: TransactionService, useValue:
          {
            getTransactionCount: jest.fn(),
          },
        },
        {
          provide: PluginService, useValue:
          {
            getEgldPrice: jest.fn(),
            processAbout: jest.fn(),
          },
        },
        {
          provide: ApiService, useValue:
          {
            get: jest.fn(),
          },
        },
        {
          provide: StakeService, useValue:
          {
            getGlobalStake: jest.fn(),
          },
        },
        {
          provide: SmartContractResultService, useValue:
          {
            getScResultsCount: jest.fn(),
          },
        },
      ],
    }).compile();

    networkService = moduleRef.get<NetworkService>(NetworkService);
  });

  it('service should be defined', () => {
    expect(networkService).toBeDefined();
  });

  describe('getConstants', () => {
    it('should return network constants from cache', async () => {
      // mock the cachingService's getOrSetCache method to always return network constants,
      // which means getConstantsRaw method will not be called
      // eslint-disable-next-line require-await
      jest.spyOn(networkService['cachingService'], 'getOrSetCache').mockImplementation(async () => ({
        chainId: 'T',
        gasPerDataByte: 1000,
        minGasLimit: 20000,
        minGasPrice: 1000000000,
        minTransactionVersion: 2,
      }));

      const constants = await networkService.getConstants();

      // assert that the constants are what we expect
      expect(constants.chainId).toBe('T');
      expect(constants.gasPerDataByte).toBe(1000);
      expect(constants.minGasLimit).toBe(20000);
      expect(constants.minGasPrice).toBe(1000000000);
      expect(constants.minTransactionVersion).toBe(2);
    });
  });
});
