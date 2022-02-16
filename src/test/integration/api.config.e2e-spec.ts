import { ApiConfigService } from "../../common/api-config/api.config.service";
import Initializer from "./e2e-init";
import { Constants } from "../../utils/constants";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";

describe('API Config', () => {
  let apiConfigService: ApiConfigService;

  const esdtContractAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';
  const auctionContractAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l';
  const stakingContractAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7';
  const delegationContractAddress: string = 'erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt';
  const delegationManagerContractAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6';

  const gatewayUrl: string = 'https://gateway.elrond.com';
  const elasticUrl: string = 'https://index.elrond.com';
  const mexUrl: string = 'https://mex-indexer.elrond.com';
  const ifpsUrl: string = 'https://ipfs.io/ipfs';
  const vmQueryUrl: string = 'https://gateway.elrond.com';
  const providersUrl: string = 'https://internal-delegation-api.elrond.com/providers';
  const mediaUrl: string = 'https://media.elrond.com';
  const externalMediaUrl: string = 'https://media.elrond.com';
  const thumbnailsNftUrl: string = 'https://media.elrond.com/nfts/thumbnail';
  const rabbitMqUrl: string = 'amqp://127.0.0.1:5672';

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  }, Constants.oneHour() * 1000);

  describe('Get Config values', () => {

    describe('getApiUrls', () => {
      it('should return a list of API urls', () => {
        const value = apiConfigService.getApiUrls();
        expect(value).toBeInstanceOf(Array);
      });

      it('should return gateway url', () => {
        const value = apiConfigService.getGatewayUrl();
        expect(value).toBe(gatewayUrl);
      });

      it('should return elastic url', () => {
        const value = apiConfigService.getElasticUrl();
        expect(value).toBe(elasticUrl);
      });

      it('should return mex url', () => {
        const value = apiConfigService.getMexUrl();
        expect(value).toBe(mexUrl);
      });

      it('should return IPFS URL', () => {
        const value = apiConfigService.getIpfsUrl();
        expect(value).toBe(ifpsUrl);
      });

      it('should return ESDT contract address', () => {
        const value = apiConfigService.getEsdtContractAddress();
        expect(value).toBe(esdtContractAddress);
      });

      it('should return auction contract address', () => {
        const value = apiConfigService.getAuctionContractAddress();
        expect(value).toBe(auctionContractAddress);
      });

      it('should return staking contract address', () => {
        const value = apiConfigService.getStakingContractAddress();
        expect(value).toBe(stakingContractAddress);
      });

      it('should return delegation contract address', () => {
        const value = apiConfigService.getDelegationContractAddress();
        expect(value).toBe(delegationContractAddress);
      });

      it('should return delegation contract shard id', () => {
        const value = apiConfigService.getDelegationContractShardId();
        expect(value).toBe(2);
      });

      it('should return delegation manager contract address', () => {
        const value = apiConfigService.getDelegationManagerContractAddress();
        expect(value).toBe(delegationManagerContractAddress);
      });

      it('should return Vm Query Url', () => {
        const value = apiConfigService.getVmQueryUrl();
        expect(value).toBe(vmQueryUrl);
      });

      it('should return redis url', () => {
        const value = apiConfigService.getRedisUrl();
        expect(value).toBe('127.0.0.1');
      });

      it('should return cache Ttl', () => {
        const value = apiConfigService.getCacheTtl();
        expect(value).toBe(6);
      });

      it('should return network', () => {
        const value = apiConfigService.getNetwork();
        expect(value).toBe('mainnet');
      });

      it('should return pool limit', () => {
        const value = apiConfigService.getPoolLimit();
        expect(value).toBe(10);
      });

      it('should return process ttl', () => {
        const value = apiConfigService.getProcessTtl();
        expect(value).toBe(600);
      });

      it('should return axios timeout', () => {
        const value = apiConfigService.getAxiosTimeout();
        expect(value).toBe(61000);
      });

      it('should return server timeout', () => {
        const value = apiConfigService.getServerTimeout();
        expect(value).toBe(60000);
      });

      it('should return headers timeout', () => {
        const value = apiConfigService.getHeadersTimeout();
        expect(value).toBe(61000);
      });

      it('should return catching flag True', () => {
        const value = apiConfigService.getUseRequestCachingFlag();
        expect(value).toBeTruthy();
      });

      it('should return logging flag False', () => {
        const value = apiConfigService.getUseRequestLoggingFlag();
        expect(value).toBeFalsy();
      });

      it('should return agent flag true', () => {
        const value = apiConfigService.getUseKeepAliveAgentFlag();
        expect(value).toBeTruthy();
      });

      it('should return tracing flag', () => {
        const value = apiConfigService.getUseTracingFlag();
        expect(value).toBeFalsy();
      });

      it('should return vm query tracing flag', () => {
        const value = apiConfigService.getUseVmQueryTracingFlag();
        expect(value).toBeFalsy();
      });

      it('should return providers url', () => {
        const value = apiConfigService.getProvidersUrl();
        expect(value).toBe(providersUrl);
      });

      it('should return data url', () => {
        const value = apiConfigService.getDataUrl();
        expect(value).toBeUndefined();
      });

      it('should return true if transaction processor cron is active', () => {
        const value = apiConfigService.getIsTransactionProcessorCronActive();
        expect(value).toBeTruthy();
      });

      it('should return transaction processor max number', () => {
        const value = apiConfigService.getTransactionProcessorMaxLookBehind();
        expect(value).toBe(1000);
      });

      it('should return true if cache warmer cron is active', () => {
        const value = apiConfigService.getIsCacheWarmerCronActive();
        expect(value).toBeTruthy();
      });

      it('should return false if fast warmer cron is not active', () => {
        const value = apiConfigService.getIsFastWarmerCronActive();
        expect(value).toBeFalsy();
      });

      it('should return true if public api is active', () => {
        const value = apiConfigService.getIsPublicApiActive();
        expect(value).toBeTruthy();
      });

      it('should return true if private api is active', () => {
        const value = apiConfigService.getIsPrivateApiActive();
        expect(value).toBeTruthy();
      });

      it('should return whether auth is active', () => {
        const value = apiConfigService.getIsAuthActive();
        expect(value).toBeFalsy();
      });

      it('should return database host', () => {
        const value = apiConfigService.getDatabaseHost();
        expect(value).toBe('localhost');
      });

      it('should return database port', () => {
        const value = apiConfigService.getDatabasePort();
        expect(value).toBe(3306);
      });

      it('should return database username', () => {
        const value = apiConfigService.getDatabaseUsername();
        expect(value).toBe('root');
      });

      it('should return database password', () => {
        const value = apiConfigService.getDatabasePassword();
        expect(value).toBe('root');
      });

      it('should return database name', () => {
        const value = apiConfigService.getDatabaseName();
        expect(value).toBe('api');
      });

      it('should return meta chain shard id', () => {
        const value = apiConfigService.getMetaChainShardId();
        expect(value).toBe(4294967295);
      });

      it('should return whether to use legacy elastic', () => {
        const value = apiConfigService.getUseLegacyElastic();
        expect(value).toStrictEqual(false);
      });

      it('should return rate limiter secret', () => {
        const value = apiConfigService.getRateLimiterSecret();
        expect(value).toBeUndefined();
      });

      it('should return array of inflation amounts', () => {
        const value = apiConfigService.getInflationAmounts();
        expect(value).toBeInstanceOf(Array);
      });

      it('should return media url', () => {
        const value = apiConfigService.getMediaUrl();
        expect(value).toBe(mediaUrl);
      });

      it('should return media internal url', () => {
        const value = apiConfigService.getMediaInternalUrl();
        expect(value).toBeUndefined();
      });

      it('should return external media url', () => {
        const value = apiConfigService.getExternalMediaUrl();
        expect(value).toBe(externalMediaUrl);
      });

      it('should return nft thumbnails url', () => {
        const value = apiConfigService.getNftThumbnailsUrl();
        expect(value).toBe(thumbnailsNftUrl);
      });

      it('should return access address', () => {
        const value = apiConfigService.getAccessAddress();
        expect(value).toBe('');
      });

      it('should return mock path', () => {
        const value = apiConfigService.getMockPath();
        expect(value).toBe('./src/test/mocks/');
      });

      it('should return null', () => {
        const value = apiConfigService.getSecurityAdmins();
        expect(value).toBeNull();
      });

      it('should return false with nfts flag not active', () => {
        const value = apiConfigService.getIsProcessNftsFlagActive();
        expect(value).toBeFalsy();
      });

      it('should return rabbitMq url', () => {
        const value = apiConfigService.getRabbitmqUrl();
        expect(value).toBe(rabbitMqUrl);
      });
    });
  });
});
