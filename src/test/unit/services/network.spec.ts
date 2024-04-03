import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataApiService } from "src/common/data-api/data-api.service";
import { NetworkConfig } from "src/common/gateway/entities/network.config";
import { NetworkStatus } from "src/common/gateway/entities/network.status";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
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
  let apiConfigService: ApiConfigService;
  let gatewayService: GatewayService;
  let blockService: BlockService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let smartContractResultService: SmartContractResultService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NetworkService,
        {
          provide: ApiConfigService,
          useValue:
          {
            getNetwork: jest.fn(),
            getCluster: jest.fn(),
            getInflationAmounts: jest.fn(),
            isStakingV4Enabled: jest.fn(),
            getMetaChainShardId: jest.fn(),
            getAuctionContractAddress: jest.fn(),
            getDelegationContractAddress: jest.fn(),
            isUpdateCollectionExtraDetailsEnabled: jest.fn(),
            isMarketplaceFeatureEnabled: jest.fn(),
            isExchangeEnabled: jest.fn(),
            isDataApiFeatureEnabled: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue:
          {
            getNetworkConfig: jest.fn(),
            getNetworkStatus: jest.fn(),
            getValidatorAuctions: jest.fn(),
            getAddressDetails: jest.fn(),
            getNetworkEconomics: jest.fn(),
          },
        },
        {
          provide: AccountService,
          useValue:
          {
            getAccountRaw: jest.fn(),
            getAccountsCount: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue:
          {
            getEgldPrice: jest.fn(),
            processAbout: jest.fn(),
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
          provide: BlockService,
          useValue: {
            getBlocksCount: jest.fn(),
          },
        },
        {
          provide: TransactionService,
          useValue: {
            getTransactionCount: jest.fn(),
          },
        },
        {
          provide: StakeService,
          useValue: {
            getGlobalStake: jest.fn(),
          },
        },
        {
          provide: SmartContractResultService,
          useValue: {
            getScResultsCount: jest.fn(),
            getAccountScResultsCount: jest.fn(),
          },
        },
        {
          provide: DataApiService,
          useValue: {
            getEgldPrice: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            getTokenMarketCapRaw: jest.fn(),
          },
        },
        {
          provide: IndexerService,
          useValue: {
            getIndexerVersion: jest.fn(),
          },
        },
      ],
    }).compile();

    networkService = moduleRef.get<NetworkService>(NetworkService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    gatewayService = moduleRef.get<GatewayService>(GatewayService);
    blockService = moduleRef.get<BlockService>(BlockService);
    accountService = moduleRef.get<AccountService>(AccountService);
    transactionService = moduleRef.get<TransactionService>(TransactionService);
    smartContractResultService = moduleRef.get<SmartContractResultService>(SmartContractResultService);
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

  describe('getAbout', () => {
    it('should return API general information', async () => {
      const expectedValues = {
        appVersion: '8f2b49d',
        pluginsVersion: 'e0a77bc',
        network: 'mainnet',
        cluster: undefined,
        version: '',
        scamEngineVersion: '1.0.0',
        features: {
          updateCollectionExtraDetails: false,
          marketplace: true,
          exchange: true,
          dataApi: true,
        },
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

      jest.spyOn(apiConfigService, 'isUpdateCollectionExtraDetailsEnabled').mockReturnValue(false);
      jest.spyOn(apiConfigService, 'isMarketplaceFeatureEnabled').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'isExchangeEnabled').mockReturnValue(true);
      jest.spyOn(apiConfigService, 'isDataApiFeatureEnabled').mockReturnValue(true);

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

  describe('getStats', () => {
    it('should return stats details', async () => {
      const mockNetworkConfig: NetworkConfig = {
        erd_adaptivity: false,
        erd_chain_id: '1',
        erd_denomination: 18,
        erd_gas_per_data_byte: 1500,
        erd_gas_price_modifier: '0.01',
        erd_hysteresis: '0.200000',
        erd_latest_tag_software_version: 'v1.5.14.0',
        erd_max_gas_per_transaction: 600000000,
        erd_meta_consensus_group_size: 400,
        erd_min_gas_limit: 50000,
        erd_min_gas_price: 1000000000,
        erd_min_transaction_version: 1,
        erd_num_metachain_nodes: 400,
        erd_num_nodes_in_shard: 400,
        erd_num_shards_without_meta: 3,
        erd_rewards_top_up_gradient_point: '2000000000000000000000000',
        erd_round_duration: 6000,
        erd_rounds_per_epoch: 14400,
        erd_shard_consensus_group_size: 63,
        erd_start_time: 1596117600,
        erd_top_up_factor: '0.500000',
      };

      const mockNetworkStatus: NetworkStatus = {
        erd_cross_check_block_height: '0: 17287291, 1: 17280583, 2: 17287747, ',
        erd_current_round: 17293220,
        erd_epoch_number: 1200,
        erd_highest_final_nonce: 17272382,
        erd_nonce: 17272383,
        erd_nonce_at_epoch_start: 17260366,
        erd_nonces_passed_in_current_epoch: 12017,
        erd_round_at_epoch_start: 17281202,
        erd_rounds_passed_in_current_epoch: 12018,
        erd_rounds_per_epoch: 14400,
      };

      jest.spyOn(apiConfigService, 'getMetaChainShardId').mockReturnValue(4294967295);
      jest.spyOn(gatewayService, 'getNetworkConfig').mockResolvedValue(mockNetworkConfig);
      jest.spyOn(gatewayService, 'getNetworkStatus').mockResolvedValue(mockNetworkStatus);
      jest.spyOn(blockService, 'getBlocksCount').mockResolvedValue(97128014);
      jest.spyOn(accountService, 'getAccountsCount').mockResolvedValue(2429648);
      jest.spyOn(transactionService, 'getTransactionCount').mockResolvedValue(87054604);
      jest.spyOn(smartContractResultService, 'getScResultsCount').mockResolvedValue(271213143);

      const result = await networkService.getStats();

      expect(apiConfigService.getMetaChainShardId).toHaveBeenCalled();
      expect(gatewayService.getNetworkConfig).toHaveBeenCalled();
      expect(gatewayService.getNetworkStatus).toHaveBeenCalled();
      expect(blockService.getBlocksCount).toHaveBeenCalled();
      expect(accountService.getAccountsCount).toHaveBeenCalled();
      expect(transactionService.getTransactionCount).toHaveBeenCalled();
      expect(smartContractResultService.getScResultsCount).toHaveBeenCalled();

      expect(result).toEqual(expect.objectContaining({
        shards: 3,
        blocks: 97128014,
        accounts: 2429648,
        transactions: 358267747,
        scResults: 271213143,
        refreshRate: 6000,
        epoch: 1200,
        roundsPassed: 12018,
        roundsPerEpoch: 14400,
      }));
    });
  });
});
