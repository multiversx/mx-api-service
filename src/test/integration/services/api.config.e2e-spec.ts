import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { DatabaseConnectionOptions } from "src/common/persistence/database/entities/connection.options";
import { ApiConfigService } from "src/common/api-config/api.config.service";

describe('API Config', () => {
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ApiConfigModule],
    }).compile();

    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getApiUrls", () => {
    it("should return api urls", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => [
          'https://api.elrond.com',
          'https://devnet-api.elrond.com',
          'https://testnet-api.elrond.com',
        ]));

      const results = apiConfigService.getApiUrls();
      expect(results).toEqual(expect.arrayContaining([
        'https://api.elrond.com',
        'https://devnet-api.elrond.com',
        'https://testnet-api.elrond.com',
      ]));
    });

    it("should throw error because test simulates that api urls are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getApiUrls()).toThrowError('No API urls present');
    });
  });

  describe("getGatewayUrl", () => {
    it("should return gateway url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['https://gateway.elrond.com']));

      const results = apiConfigService.getGatewayUrl();
      expect(results).toEqual('https://gateway.elrond.com');
    });

    it("should throw error because test simulates that gateway url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getGatewayUrl()).toThrowError('No gateway urls present');
    });
  });

  describe("getElasticUrl", () => {
    it("should return elastic url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['https://index.elrond.com']));

      const results = apiConfigService.getElasticUrl();
      expect(results).toEqual('https://index.elrond.com');
    });

    it("should throw error because test simulates that elastic url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getElasticUrl()).toThrowError('No elastic urls present');
    });
  });

  describe("getMexUrl", () => {
    it("should return mex url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['https://mex-indexer.elrond.com']));

      const results = apiConfigService.getMexUrl();
      expect(results).toEqual('https://mex-indexer.elrond.com');
    });

    it("should return undefined because test simulates that mex url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getMexUrl();
      expect(results).toEqual('');
    });
  });

  describe("getIpfsUrl", () => {
    it("should return Ipfs url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['https://ipfs.io/ipfs']));

      const results = apiConfigService.getIpfsUrl();
      expect(results).toEqual(['https://ipfs.io/ipfs']);
    });

    it("should return default Ipfs Url", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIpfsUrl();
      expect(results).toEqual('https://ipfs.io/ipfs');
    });
  });

  describe("getSocketUrl", () => {
    it("should return socket url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['socket-fra.elrond.com']));

      const results = apiConfigService.getSocketUrl();
      expect(results).toEqual(['socket-fra.elrond.com']);
    });

    it("should throw error because test simulates that socket url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getSocketUrl()).toThrowError('No socket url present');
    });
  });

  describe("getMaiarIdUrl", () => {
    it("should return maiarId url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://testnet-id.maiar.com'));

      const results = apiConfigService.getSocketUrl();
      expect(results).toEqual('https://testnet-id.maiar.com');
    });
  });

  describe("getEsdtContractAddress", () => {
    it("should return esdt contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'));

      const results = apiConfigService.getEsdtContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u');
    });

    it("should throw error because test simulates that esdt contract address is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getEsdtContractAddress()).toThrowError('No ESDT contract present');
    });
  });

  describe("getAuctionContractAddress", () => {
    it("should return auction contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l'));

      const results = apiConfigService.getAuctionContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l');
    });

    it("should throw error because test simulates that auction contract address is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getAuctionContractAddress()).toThrowError('No auction contract present');
    });
  });

  describe("getStakingContractAddress", () => {
    it("should return staking contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7'));

      const results = apiConfigService.getStakingContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7');
    });

    it("should throw error because test simulates that staking contract address is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getStakingContractAddress()).toThrowError('No staking contract present');
    });
  });

  describe("getDelegationContractAddress", () => {
    it("should return delegation contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt'));

      const results = apiConfigService.getDelegationContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt');
    });

    it("should throw error because test simulates that delegation contract address is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDelegationContractAddress()).toThrowError('No delegation contract present');
    });
  });

  describe("getMetabondingContractAddress", () => {
    it("should return metabonding contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqpgq50dge6rrpcra4tp9hl57jl0893a4r2r72jpsk39rjj'));

      const results = apiConfigService.getMetabondingContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqpgq50dge6rrpcra4tp9hl57jl0893a4r2r72jpsk39rjj');
    });

    it("should return undefined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(apiConfigService.getMetabondingContractAddress()).toBeUndefined();
    });
  });

  describe("getDelegationContractShardId", () => {
    it("should return delegation contract shardId address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => '2'));

      const results = apiConfigService.getDelegationContractShardId();
      expect(results).toEqual('2');
    });

    it("should throw error because test simulates that delegation contract shardId is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDelegationContractShardId()).toThrowError('No delegation contract shard ID present');
    });
  });

  describe("getDelegationManagerContractAddress", () => {
    it("should return delegation manager contract address", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6'));

      const results = apiConfigService.getDelegationManagerContractAddress();
      expect(results).toEqual('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6');
    });

    it("should throw error because test simulates that delegation manager contract address is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDelegationManagerContractAddress()).toThrowError('No delegation manager contract present');
    });
  });

  describe("getVmQueryUrl", () => {
    it("should return vm query url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['https://gateway.elrond.com']));

      const results = apiConfigService.getVmQueryUrl();
      expect(results).toEqual('https://gateway.elrond.com');
    });

    it("should throw error because test simulates that vm query url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getVmQueryUrl()).toThrowError('No gateway urls present');
    });
  });

  describe("getRedisUrl", () => {
    it("should return redis url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => '127.0.0.1'));

      const results = apiConfigService.getRedisUrl();
      expect(results).toEqual('127.0.0.1');
    });

    it("should throw error because test simulates that redis url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getRedisUrl()).toThrowError('No redis url present');
    });
  });

  describe("getRabbitmqUrl", () => {
    it("should return rabbitmq url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'amqp://127.0.0.1:5672'));

      const results = apiConfigService.getRabbitmqUrl();
      expect(results).toEqual('amqp://127.0.0.1:5672');
    });

    it("should throw error because test simulates that rabbitmq url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getRabbitmqUrl()).toThrowError('No rabbitmq url present');
    });
  });

  describe("getCacheTtl", () => {
    it("should return cache tll value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 6));

      const results = apiConfigService.getCacheTtl();
      expect(results).toEqual(6);
    });

    it("should return default value for cache ttl if caching.cacheTtl is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getCacheTtl();
      expect(results).toEqual(6);
    });
  });

  describe("getNetwork", () => {
    it("should return mainnet network configuration", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'mainnet'));

      const results = apiConfigService.getNetwork();
      expect(results).toEqual('mainnet');
    });

    it("should throw error because test simulates that mainnet network configuration is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getNetwork()).toThrowError('No network present');
    });
  });

  describe("getNetwork", () => {
    it("should return mainnet network configuration", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'testnet'));

      const results = apiConfigService.getNetwork();
      expect(results).toEqual('testnet');
    });

    it("should throw error because test simulates that testnet network configuration is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getNetwork()).toThrowError('No network present');
    });
  });

  describe("getNetwork", () => {
    it("should return mainnet network configuration", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'devnet'));

      const results = apiConfigService.getNetwork();
      expect(results).toEqual('devnet');
    });

    it("should throw error because test simulates that devnet network configuration is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getNetwork()).toThrowError('No network present');
    });
  });

  describe("getPoolLimit", () => {
    it("should return pool limit value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 10));

      const results = apiConfigService.getPoolLimit();
      expect(results).toEqual(10);
    });

    it("should return default value for pool limit if caching.poolLimit is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getPoolLimit();
      expect(results).toEqual(100);
    });
  });

  describe("getProcessTtl", () => {
    it("should return process ttl value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 600));

      const results = apiConfigService.getProcessTtl();
      expect(results).toEqual(600);
    });

    it("should return default value for process ttl if caching.processTtlt is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getProcessTtl();
      expect(results).toEqual(60);
    });
  });

  describe("getAxiosTimeout", () => {
    it("should return axios timeout value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 61000));

      const results = apiConfigService.getAxiosTimeout();
      expect(results).toEqual(61000);
    });

    it("should return default value for axios timeout if keepAliveTimeout.downstream is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getAxiosTimeout();
      expect(results).toEqual(61000);
    });
  });

  describe("getServerTimeout", () => {
    it("should return server timeout value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 60000));

      const results = apiConfigService.getServerTimeout();
      expect(results).toEqual(60000);
    });

    it("should return default value for server timeout if keepAliveTimeout.upstream is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getServerTimeout();
      expect(results).toEqual(60000);
    });
  });

  describe("getHeadersTimeout", () => {
    it("should return headers timeout value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 60000));

      const results = apiConfigService.getHeadersTimeout();
      expect(results).toEqual(61000);
    });
  });

  describe("getUseRequestCachingFlag", () => {
    it("should return request caching flag value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getUseRequestCachingFlag();
      expect(results).toEqual(true);
    });

    it("should return default value for useRequestCachingFlag if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getUseRequestCachingFlag();
      expect(results).toEqual(true);
    });
  });

  describe("getUseRequestLoggingFlag", () => {
    it("should return request logging flag value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getUseRequestLoggingFlag();
      expect(results).toEqual(true);
    });

    it("should return default value for useRequestLoggingFlag if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getUseRequestLoggingFlag();
      expect(results).toEqual(false);
    });
  });

  describe("getUseKeepAliveAgentFlag", () => {
    it("should return keep alive agent flag value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getUseKeepAliveAgentFlag();
      expect(results).toEqual(true);
    });

    it("should return default value for useRequestLoggingFlag if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getUseKeepAliveAgentFlag();
      expect(results).toEqual(true);
    });
  });

  describe("getUseTracingFlag", () => {
    it("should return use tracing flag value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => false));

      const results = apiConfigService.getUseTracingFlag();
      expect(results).toEqual(false);
    });

    it("should return default value for getUseTracingFlag if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getUseTracingFlag();
      expect(results).toEqual(false);
    });
  });

  describe("getProvidersUrl", () => {
    it("should return providers url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://internal-delegation-api.elrond.com/providers'));

      const results = apiConfigService.getProvidersUrl();
      expect(results).toEqual('https://internal-delegation-api.elrond.com/providers');
    });

    it("should throw error because test simulates that providers url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getProvidersUrl()).toThrowError('No providers url present');
    });
  });

  describe("getDataUrl", () => {
    it("should return data url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getDataUrl();
      expect(results).toEqual(undefined);
    });
  });

  describe("getTempUrl", () => {
    it("should return temp url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => '/tmp'));

      const results = apiConfigService.getTempUrl();
      expect(results).toEqual('/tmp');
    });

    it("should throw error because test simulates that temp url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getTempUrl()).toThrowError('No tmp url present');
    });
  });

  describe("getIsTransactionProcessorCronActive", () => {
    it("should return transactoion processor cron active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsTransactionProcessorCronActive();
      expect(results).toEqual(true);
    });

    it("should throw error because test simulates that transaction processor cron is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getIsTransactionProcessorCronActive()).toThrowError('No cron.transactionProcessor flag present');
    });
  });

  describe("getTransactionProcessorMaxLookBehind", () => {
    it("should returntransaction processor max look behind", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 1000));

      const results = apiConfigService.getTransactionProcessorMaxLookBehind();
      expect(results).toEqual(1000);
    });

    it("should throw error because test simulates that transaction processor max look behind is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getTransactionProcessorMaxLookBehind()).toThrowError('No cron.transactionProcessorMaxLookBehind flag present');
    });
  });

  describe("getIsTransactionCompletedCronActive", () => {
    it("should return transaction complete cron active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => false));

      const results = apiConfigService.getIsTransactionCompletedCronActive();
      expect(results).toEqual(false);
    });

    it("should return default value for getIsTransactionCompletedCronActive if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIsTransactionCompletedCronActive();
      expect(results).toEqual(false);
    });
  });

  describe("getTransactionCompletedMaxLookBehind", () => {
    it("should return transaction complete max look behind value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 100));

      const results = apiConfigService.getTransactionCompletedMaxLookBehind();
      expect(results).toEqual(100);
    });

    it("should return default value for getTransactionCompletedMaxLookBehind if is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getTransactionCompletedMaxLookBehind();
      expect(results).toEqual(100);
    });
  });

  describe("getIsCacheWarmerCronActive", () => {
    it("should return cache warmer cron active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsCacheWarmerCronActive();
      expect(results).toEqual(true);
    });

    it("should throw error because test simulates that cache warmer cron is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getIsCacheWarmerCronActive()).toThrowError('No cron.cacheWarmer flag present');
    });
  });

  describe("getIsQueueWorkerCronActive", () => {
    it("should return queue worker cron active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsQueueWorkerCronActive();
      expect(results).toEqual(true);
    });

    it("should throw error because test simulates that queue worke cron is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getIsQueueWorkerCronActive()).toThrowError('No queue worker cron flag present');
    });
  });

  describe("getIsFastWarmerCronActive", () => {
    it("should return fast warmer cron active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsFastWarmerCronActive();
      expect(results).toEqual(true);
    });

    it("should return default value because test simulates that fast warmer cron is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIsFastWarmerCronActive();
      expect(results).toEqual(false);
    });
  });

  describe("getUseVmQueryTracingFlag", () => {
    it("should return vm query tracing flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getUseVmQueryTracingFlag();
      expect(results).toEqual(true);
    });

    it("should return default value because test simulates that vm query tracing flag is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getUseVmQueryTracingFlag();
      expect(results).toEqual(false);
    });
  });

  describe("getIsProcessNftsFlagActive", () => {
    it("should return process nfts flag active", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsProcessNftsFlagActive();
      expect(results).toEqual(true);
    });

    it("should return default value because test simulates that nfts flag active is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIsProcessNftsFlagActive();
      expect(results).toEqual(false);
    });
  });

  describe("getIsIndexerV3FlagActive", () => {
    it("should return indexer V3 flag active", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsIndexerV3FlagActive();
      expect(results).toEqual(true);
    });

    it("should return default value because test simulates that indexer V3 flag active is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIsIndexerV3FlagActive();
      expect(results).toEqual(false);
    });
  });

  describe("getIsPublicApiActive", () => {
    it("should return is public api active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsPublicApiActive();
      expect(results).toEqual(true);
    });

    it("should throw error because test simulates that public api flag is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getIsPublicApiActive()).toThrowError('No api.public flag present');
    });
  });

  describe("getIsPrivateApiActive", () => {
    it("should return is private api active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsPrivateApiActive();
      expect(results).toEqual(true);
    });

    it("should throw error because test simulates that private api flag is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getIsPrivateApiActive()).toThrowError('No api.private flag present');
    });
  });

  describe("getIsAuthActive", () => {
    it("should return is auth active flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsAuthActive();
      expect(results).toEqual(true);
    });

    it("should return default value because test simulates that auth active flag is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getIsAuthActive();
      expect(results).toEqual(false);
    });
  });

  describe("getDatabaseHost", () => {
    it("should return database host", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'localhost'));

      const results = apiConfigService.getDatabaseHost();
      expect(results).toEqual('localhost');
    });

    it("should throw error because test simulates that database localhost is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDatabaseHost()).toThrowError('No database.host present');
    });
  });

  describe("getDatabasePort", () => {
    it("should return database port", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 3306));

      const results = apiConfigService.getDatabasePort();
      expect(results).toEqual(3306);
    });

    it("should throw error because test simulates that database port is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDatabasePort()).toThrowError('No database.port present');
    });
  });

  describe("getDatabaseUsername", () => {
    it("should return database username", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'root'));

      const results = apiConfigService.getDatabaseUsername();
      expect(results).toEqual('root');
    });
  });

  describe("getDatabasePassword", () => {
    it("should return database username", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'root'));

      const results = apiConfigService.getDatabasePassword();
      expect(results).toEqual('root');
    });
  });

  describe("getDatabaseName", () => {
    it("should return database port", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'api'));

      const results = apiConfigService.getDatabaseName();
      expect(results).toEqual('api');
    });

    it("should throw error because test simulates that database name is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getDatabaseName()).toThrowError('No database.database present');
    });
  });

  describe("getDatabaseSlaveConnections", () => {
    it("should return database slave connections", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => DatabaseConnectionOptions));

      const results = apiConfigService.getDatabaseSlaveConnections();
      expect(results).toEqual(DatabaseConnectionOptions);
    });

    it("should return default value because test simulates that database slave connections are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getDatabaseSlaveConnections();
      expect(results).toEqual([]);
    });
  });

  describe("getImageWidth", () => {
    it("should return image width", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 600));

      const results = apiConfigService.getImageWidth();
      expect(results).toEqual(600);
    });

    it("should throw error because test simulates that image width is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getImageWidth()).toThrowError('No imageWidth present');
    });
  });

  describe("getImageWidth", () => {
    it("should return image width", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 600));

      const results = apiConfigService.getImageHeight();
      expect(results).toEqual(600);
    });

    it("should throw error because test simulates that image height is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getImageHeight()).toThrowError('No imageHeight present');
    });
  });

  describe("getImageType", () => {
    it("should return image type", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'png'));

      const results = apiConfigService.getImageType();
      expect(results).toEqual('png');
    });

    it("should throw error because test simulates that image type is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getImageType()).toThrowError('No imageType present');
    });
  });

  describe("getAwsS3Secret", () => {
    it("should return awsS3 Secret", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'aws'));

      const results = apiConfigService.getAwsS3Secret();
      expect(results).toEqual('aws');
    });

    it("should throw error because test simulates that awsS3 Secret is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getAwsS3Secret()).toThrowError('No s3Secret present');
    });
  });

  describe("getAwsS3Bucket", () => {
    it("should return awsS3 Bucket", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'aws'));

      const results = apiConfigService.getAwsS3Bucket();
      expect(results).toEqual('aws');
    });

    it("should throw error because test simulates that awsS3 Bucket is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getAwsS3Bucket()).toThrowError('No s3Bucket present');
    });
  });

  describe("getAwsS3Region", () => {
    it("should return awsS3 Region", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'aws'));

      const results = apiConfigService.getAwsS3Region();
      expect(results).toEqual('aws');
    });

    it("should throw error because test simulates that awsS3 Region is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getAwsS3Region()).toThrowError('No s3Region present');
    });
  });

  describe("getAwsS3KeyId", () => {
    it("should return awsS3 key id", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'aws'));

      const results = apiConfigService.getAwsS3KeyId();
      expect(results).toEqual('aws');
    });

    it("should throw error because test simulates that awsS3 key id is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getAwsS3KeyId()).toThrowError('No s3KeyId present');
    });
  });

  describe("getMetaChainShardId", () => {
    it("should return awsS3 Region", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 4294967295));

      const results = apiConfigService.getMetaChainShardId();
      expect(results).toEqual(4294967295);
    });

    it("should throw error because test simulates that metachain shardId is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getMetaChainShardId()).toThrowError('No metaChainShardId present');
    });
  });

  describe("getRateLimiterSecret", () => {
    it("should return undefined if rate limeter secret is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getRateLimiterSecret();
      expect(results).toEqual(undefined);
    });
  });

  describe("getInflationAmounts", () => {
    it("should return inflation amounts", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => [
          1952123,
          1746637,
          1541150,
          1335663,
          1130177,
          924690,
          719203,
        ]));

      const results = apiConfigService.getInflationAmounts();
      expect(results).toEqual(expect.arrayContaining([
        1952123,
      ]));
    });

    it("should throw error because test simulates that inflation amount are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getInflationAmounts()).toThrowError('No inflation amounts present');
    });
  });

  describe("getMediaUrl", () => {
    it("should return media url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://media.elrond.com'));

      const results = apiConfigService.getMediaUrl();
      expect(results).toEqual('https://media.elrond.com');
    });

    it("should throw error because test simulates that media url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getMediaUrl()).toThrowError('No media url present');
    });
  });

  describe("getMediaInternalUrl", () => {
    it("should return media internal url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://media-internal.elrond.com'));

      const results = apiConfigService.getMediaUrl();
      expect(results).toEqual('https://media-internal.elrond.com');
    });

    it("should throw error because test simulates that media internal url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getMediaInternalUrl();
      expect(results).toEqual(undefined);
    });
  });

  describe("getNftThumbnailsUrl", () => {
    it("should return nft thumbnails url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://media.elrond.com/nfts/thumbnail'));

      const results = apiConfigService.getNftThumbnailsUrl();
      expect(results).toEqual('https://media.elrond.com/nfts/thumbnail');
    });

    it("should throw error because test simulates that nft thumbnails urls are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getNftThumbnailsUrl()).toThrowError('No nft thumbnails url present');
    });
  });

  describe("getSecurityAdmins", () => {
    it("should return nft thumbnails url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => ['testAdmin']));

      const results = apiConfigService.getSecurityAdmins();
      expect(results).toEqual(['testAdmin']);
    });

    it("should throw error because test simulates that security admins are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getSecurityAdmins()).toThrowError('No security admins value present');
    });
  });

  describe("getJwtSecret", () => {
    it("should return nft thumbnails url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'testJwt'));

      const results = apiConfigService.getJwtSecret();
      expect(results).toEqual('testJwt');
    });

    it("should throw error because test simulates that jwt secret is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getJwtSecret()).toThrowError('No jwtSecret present');
    });
  });

  describe("getMockKeybases", () => {
    it("should return mock keybases flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getMockKeybases();
      expect(results).toEqual(true);
    });

    it("should return undefined if mock keybases are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getMockKeybases();
      expect(results).toEqual(undefined);
    });
  });

  describe("getMockNodes", () => {
    it("should return mock nodes flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getMockNodes();
      expect(results).toEqual(true);
    });

    it("should return undefined if mock nodes are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getMockNodes();
      expect(results).toEqual(undefined);
    });
  });

  describe("getMockTokens", () => {
    it("should return mock tokens flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getMockTokens();
      expect(results).toEqual(true);
    });

    it("should return undefined if mock tokens are not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getMockTokens();
      expect(results).toEqual(undefined);
    });
  });

  describe("getMockPath", () => {
    it("should return mock path", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => './src/test/mocks/'));

      const results = apiConfigService.getMockPath();
      expect(results).toEqual('./src/test/mocks/');
    });

    it("should throw error because test simulates that mock path is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getMockPath()).toThrowError('No mock path value present');
    });
  });

  describe("getNftProcessParallelism", () => {
    it("should return nft process parallelism value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 1));

      const results = apiConfigService.getNftProcessParallelism();
      expect(results).toEqual(1);
    });

    it("should return default value 1 if nft process parallelism is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getNftProcessParallelism();
      expect(results).toEqual(1);
    });
  });

  describe("getNftProcessMaxRetries", () => {
    it("should return nft process max retries value", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 3));

      const results = apiConfigService.getNftProcessMaxRetries();
      expect(results).toEqual(3);
    });

    it("should return default value 3 if nft process max retries is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getNftProcessMaxRetries();
      expect(results).toEqual(3);
    });
  });

  describe("getGithubToken", () => {
    it("should return GitHub token details", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'test'));

      const results = apiConfigService.getGithubToken();
      expect(results).toEqual('test');
    });

    it("should return undefined if GitHub token is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getGithubToken();
      expect(results).toStrictEqual(undefined);
    });
  });

  describe("getMaiarExchangeUrlMandatory", () => {
    it("should return Maiar Exchange Url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'https://graph.maiar.exchange/graphql'));

      const results = apiConfigService.getMaiarExchangeUrlMandatory();
      expect(results).toEqual('https://graph.maiar.exchange/graphql');
    });

    it("should throw new error because test simulates that Maiar Exchange Url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getMaiarExchangeUrlMandatory()).toThrowError('No transaction-action.mex.microServiceUrl present');
    });
  });

  describe("getDatabaseType", () => {
    it("should return database type details", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'mysql'));

      const results = apiConfigService.getDatabaseType();
      expect(results).toEqual('mysql');
    });

    it("should throw new error because test simulates that database type is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      expect(() => apiConfigService.getDatabaseType()).toThrowError('No database.type present');
    });
  });

  describe("getEventsNotifierExchange", () => {
    it("should return events notifier exchange details ( all_events) ", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'all_events'));

      const results = apiConfigService.getEventsNotifierExchange();
      expect(results).toEqual('all_events');
    });

    it("should throw new error because test simulates that events notifier exchange is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      expect(() => apiConfigService.getEventsNotifierExchange()).toThrowError('No events notifier exchange present');
    });
  });

  describe("getEventsNotifierUrl", () => {
    it("should return events notifier url", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'amqp://guest:guest@127.0.0.1:5672'));

      const results = apiConfigService.getEventsNotifierUrl();
      expect(results).toEqual('amqp://guest:guest@127.0.0.1:5672');
    });

    it("should throw new error because test simulates that events notifier url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      expect(() => apiConfigService.getEventsNotifierUrl()).toThrowError('No events notifier url present');
    });
  });

  describe("getEventsNotifierFeaturePort", () => {
    it("should return events notifier port", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => '5674'));

      const results = apiConfigService.getEventsNotifierFeaturePort();
      expect(results).toEqual('5674');
    });

    it("should throw new error because test simulates that events notifier port is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      expect(() => apiConfigService.getEventsNotifierFeaturePort()).toThrowError('No events notifier port present');
    });
  });

  describe("isEventsNotifierFeatureActive", () => {
    it("should return events notifier event flag", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.isEventsNotifierFeatureActive();
      expect(results).toEqual(true);
    });

    it("should return false  because test simulates that events notifier flag is false", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.isEventsNotifierFeatureActive();
      expect(results).toEqual(false);
    });
  });

  describe("getIsElasticUpdaterCronActive", () => {
    it("should return true if elastic updater cron active is enabled", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.getIsElasticUpdaterCronActive();
      expect(results).toEqual(true);
    });

    it("should return false  because test simulates that elastic updater cron is not active ( false )", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      const results = apiConfigService.getIsElasticUpdaterCronActive();
      expect(results).toEqual(false);
    });
  });

  describe("getConfig", () => {
    it("should return true if elastic updater cron active is enabled", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => [
          'https://api.elrond.com',
          'https://devnet-api.elrond.com',
          'https://testnet-api.elrond.com',
        ]));

      const results = apiConfigService.getConfig('urls.api');

      expect(results).toEqual(expect.arrayContaining([
        'https://api.elrond.com',
        'https://devnet-api.elrond.com',
        'https://testnet-api.elrond.com',
      ]));
    });
  });

  describe("getDatabaseUrl", () => {
    it("should return database url details", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'localhost'));

      const results = apiConfigService.getDatabaseUrl();
      expect(results).toEqual('localhost');
    });

    it("should throw new error because test simulates that database url is not defined", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      expect(() => apiConfigService.getDatabaseUrl()).toThrowError('No database.url present');
    });
  });

  describe("getCluster", () => {
    it("should return cluster details", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => 'clusterTest'));

      const results = apiConfigService.getCluster();
      expect(results).toStrictEqual('clusterTest');
    });

    it("should return undefined  because test simulates that cluster is not defined in config", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => undefined));

      const results = apiConfigService.getCluster();
      expect(results).toBeUndefined();
    });
  });

  describe("isStakingV4Enabled", () => {
    it("should return true if isStakingV4Enable flag is true", () => {
      jest
        .spyOn(ConfigService.prototype, "get")
        .mockImplementation(jest.fn(() => true));

      const results = apiConfigService.isStakingV4Enabled();
      expect(results).toStrictEqual(true);
    });

    it("should return false because test simulates that isStakingV4Enabled flag is not defined and by default flag value is false", () => {
      jest
        .spyOn(ConfigService.prototype, 'get')
        .mockImplementation(jest.fn(() => false));

      const results = apiConfigService.getCluster();
      expect(results).toStrictEqual(false);
    });
  });
});
