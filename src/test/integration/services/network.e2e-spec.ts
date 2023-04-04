import { ApiService, ElrondCachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataApiService } from "src/common/data-api/data-api.service";
import { Auction } from "src/common/gateway/entities/auction";
import { AuctionNode } from "src/common/gateway/entities/auction.node";
import { NetworkConfig } from "src/common/gateway/entities/network.config";
import { NetworkStatus } from "src/common/gateway/entities/network.status";
import { GatewayService } from "src/common/gateway/gateway.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { About } from "src/endpoints/network/entities/about";
import { Economics } from "src/endpoints/network/entities/economics";
import { NetworkService } from "src/endpoints/network/network.service";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { CacheInfo } from "src/utils/cache.info";

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
          provide: ElrondCachingService, useValue:
          {
            getOrSet: jest.fn(),
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
        {
          provide: DataApiService, useValue:
          {
            getEgldPrice: jest.fn(),
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
      // eslint-disable-next-line require-await
      jest.spyOn(networkService['cachingService'], 'getOrSet').mockImplementation(async () => ({
        chainId: 'T',
        gasPerDataByte: 1000,
        minGasLimit: 20000,
        minGasPrice: 1000000000,
        minTransactionVersion: 2,
      }));

      const constants = await networkService.getConstants();

      expect(constants.chainId).toBe('T');
      expect(constants.gasPerDataByte).toBe(1000);
      expect(constants.minGasLimit).toBe(20000);
      expect(constants.minGasPrice).toBe(1000000000);
      expect(constants.minTransactionVersion).toBe(2);
    });
  });

  describe('getNetworkConfig', () => {
    it('should return network config when both promises resolve with valid values', async () => {
      const getNetworkConfigSpy = jest.spyOn(networkService['gatewayService'], 'getNetworkConfig').mockResolvedValue(new NetworkConfig({
        erd_round_duration: 5000,
        erd_rounds_per_epoch: 10,
      }));

      jest.spyOn(networkService['gatewayService'], 'getNetworkStatus').mockResolvedValue(new NetworkStatus({
        erd_rounds_passed_in_current_epoch: 3,
      }));

      const result = await networkService.getNetworkConfig();

      expect(getNetworkConfigSpy).toHaveBeenCalledWith();
      expect(result).toEqual({
        roundsPassed: 3,
        roundsPerEpoch: 10,
        roundDuration: 5,
      });
    });

    it('should throw error when getNetworkStatus() promise rejects', async () => {
      jest.spyOn(networkService['gatewayService'], 'getNetworkConfig').mockResolvedValue(new NetworkConfig({
        erd_round_duration: 5000,
        erd_rounds_per_epoch: 10,
      }));
      jest.spyOn(networkService['gatewayService'], 'getNetworkStatus').mockRejectedValue(new Error('Unable to get network status'));

      await expect(networkService.getNetworkConfig()).rejects.toThrow('Unable to get network status');
    });
  });

  describe('getEconomics', () => {
    it('should return cached value when available', async () => {
      const expectedEconomics = new Economics({
        totalSupply: 20000000000,
        circulatingSupply: 19900000000,
        staked: 1000000,
        price: 1.23,
        marketCap: 24570000000,
        apr: 3.2,
        topUpApr: 3.4,
        baseApr: 3.0,
        tokenMarketCap: 50000000,
      });
      const getOrSetSpy = jest.spyOn(networkService['cachingService'], 'getOrSet').mockImplementation((_key, getter) => getter());

      jest.spyOn(networkService['cachingService'], 'getOrSet').mockImplementationOnce((_key) => Promise.resolve(expectedEconomics));

      const result = await networkService.getEconomics();

      expect(getOrSetSpy).toHaveBeenCalledWith(CacheInfo.Economics.key, expect.any(Function), CacheInfo.Economics.ttl);
      expect(result).toEqual(expectedEconomics);
    });
  });

  describe("getMinimumAuctionTopUp", () => {
    it("Should correctly calculate minimum auction topup", async () => {
      jest.spyOn(networkService['gatewayService'], "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "0",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2400000000000000000000');
    });

    it("Should correctly calculate minimum auction topup even if values come sorted wrongly", async () => {
      jest.spyOn(networkService['gatewayService'], "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "0",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2400000000000000000000');
    });

    it("Should return correctly minimum auction topup if all values are selected", async () => {
      jest.spyOn(networkService['gatewayService'], "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2300000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": true }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toStrictEqual('2300000000000000000000');
    });

    it("Should return undefined as minimum auction topup if all values are not selected", async () => {
      jest.spyOn(networkService['gatewayService'], "getValidatorAuctions")
        .mockImplementation(jest.fn(() => Promise.resolve([
          new Auction({
            "qualifiedTopUp": "2500000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2400000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
          new Auction({
            "qualifiedTopUp": "2300000000000000000000",
            "auctionList": [
              new AuctionNode({ "selected": false }),
            ],
          }),
        ])));

      const minimumAuctionTopUp = await networkService.getMinimumAuctionTopUp();

      expect(minimumAuctionTopUp).toBeUndefined();
    });
  });

  describe('getAbout', () => {
    it('should return API general information', async () => {
      const expectedValues = {
        appVersion: '8f2b49d',
        pluginsVersion: 'e0a77bc',
        network: 'mainnet',
        cluster: undefined,
        version: '',
        scamEngineVersion: '1.0.0',
      };
      jest
        .spyOn(networkService['cachingService'], 'getOrSet')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, _promise: any) => expectedValues));

      jest
        .spyOn(NetworkService.prototype, 'getAboutRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => {
          return new About({
            appVersion: '8f2b49d',
            pluginsVersion: 'e0a77bc',
            network: 'mainnet',
            cluster: undefined,
            scamEngineVersion: '1.0.0',
          });
        }));

      const result = await networkService.getAbout();
      expect(result).toStrictEqual(expectedValues);
    });
  });

  describe('getAboutRaw', () => {
    it('should return mainnet API general configuration', async () => {
      jest.mock("child_process", () => {
        return {
          execSync: () => "8f2b49d",
        };
      });

      jest.spyOn(ApiConfigService.prototype, 'getNetwork')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => ('mainnet')));

      jest.spyOn(ApiConfigService.prototype, 'getCluster')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => undefined));

      const result = await networkService.getAboutRaw();

      expect(result.appVersion).toStrictEqual('8f2b49d');
      expect(result.network).toStrictEqual('mainnet');
      expect(result.cluster).toBeUndefined();
    });
  });

  describe('numberDecode', () => {
    it('should decode base64-encoded number and return the correct string', () => {
      const encodedNumber = 'MTIzNDU2Nzg5MA==';
      const decodedNumber = networkService.numberDecode(encodedNumber);

      expect(decodedNumber).toBe('232321984496799787268400');
    });

    it('should return 0 when input is an empty string', () => {
      const encodedNumber = '';
      const decodedNumber = networkService.numberDecode(encodedNumber);

      expect(decodedNumber).toBe('0');
    });
  });
});
