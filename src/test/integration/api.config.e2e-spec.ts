import { ApiConfigService } from "../../common/api-config/api.config.service";
import Initializer from "./e2e-init";
import { Constants } from "../../utils/constants";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";

describe('API Config', () => {
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
  }, Constants.oneHour() * 1000);

  describe('Get Urls', () => {
    describe('getApiUrls', () => {
      it('should return a list of urls', async () => {
        const getUrlsList = apiConfigService.getApiUrls();
        expect(getUrlsList).toBeInstanceOf(Array);
      })
      it('should return No API urls present', async () => {
        const getUrl = apiConfigService.getApiUrls();
        if (!getUrl) {
          expect(getUrl).toThrow('No API urls present')
        }
      })
    });
  });
  describe('Get Gateway URL', () => {
    describe('getGatewayUrl', () => {
      it('should return gateway url', async () => {
        const getGateway = apiConfigService.getGatewayUrl();
        expect(getGateway).toBe('https://gateway.elrond.com');
      })
      it('should return no gateway urls present', async () => {
        const getGateway = apiConfigService.getGatewayUrl();
        if (!getGateway) {
          expect(getGateway).toThrow('No gateway urls present');
        }
      })
    });
  });
  describe('Get Elastic URL', () => {
    describe('getElasticUrl', () => {
      it('should return elastic url', async () => {
        const getElastic = apiConfigService.getElasticUrl();
        expect(getElastic).toBe('https://index.elrond.com');
      })
      it('should return no elastic urls present', async () => {
        const getElastic = apiConfigService.getElasticUrl();
        if (!getElastic) {
          expect(getElastic).toThrow('No elastic urls present');
        }
      })
    });
  });
  describe('Get Mex URL', () => {
    describe('getMexUrl', () => {
      it('should return empty string', async () => {
        const getMex = apiConfigService.getMexUrl();
        if (!getMex)
          expect(getMex).toBe('');
      })
      it('should return Mex url', async () => {
        const getMex = apiConfigService.getMexUrl();
        if (getMex) {
          expect(getMex).toBe('https://mex-indexer.elrond.com');
        }
      })
    });
  });
  describe('Get Ipfs URL', () => {
    describe('getIpfsUrl', () => {
      it('should return IPFS URL', async () => {
        const getIpfs = apiConfigService.getIpfsUrl();
        expect(getIpfs).toBe('https://ipfs.io/ipfs')
      })
      it('should return no IPFS url', async () => {
        const getIpfs = apiConfigService.getIpfsUrl();
        if (!getIpfs) {
          expect(getIpfs).toThrow('No Ipfs Urls');
        }
      })
    });
  });
  describe('Get Esdt Contract Address', () => {
    describe('getEsdtContractAddress', () => {
      it('should return Esdt Contract Address', async () => {
        const getEsdtAddress = apiConfigService.getEsdtContractAddress();
        expect(getEsdtAddress).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u')
      })
      it('should throw error', async () => {
        const getEsdtAddress = apiConfigService.getEsdtContractAddress();
        if (!getEsdtAddress) {
          expect(getEsdtAddress).toThrow('No ESDT contract present');
        }
      })
    });
  });
  describe('Get Auction Contract Address', () => {
    describe('getAuctionContractAddress', () => {
      it('should return auction contract address', async () => {
        const getAuction = apiConfigService.getAuctionContractAddress();
        expect(getAuction).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')
      })
      it('should throw error', async () => {
        const getAuction = apiConfigService.getAuctionContractAddress();
        if (!getAuction) {
          expect(getAuction).toThrow('No auction contract present')
        }
      })
    });
  });
  describe('Get Staking Contract Address', () => {
    describe('getStakingContractAddress', () => {
      it('should return staking contract address', async () => {
        const getStaking = apiConfigService.getStakingContractAddress();
        expect(getStaking).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7')
      })
      it('should throw error', async () => {
        const getStaking = apiConfigService.getStakingContractAddress();
        if (!getStaking) {
          expect(getStaking).toThrow('No Staking contract present')
        }
      })
    });
  });
  describe('Get Delegation Contract Address', () => {
    describe('getDelegationContractAddress', () => {
      it('should return delegation contract address', () => {
        const getDelegationAddress = apiConfigService.getDelegationContractAddress();
        expect(getDelegationAddress).toBe('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt')
      })
      it('should throw error', async () => {
        const getDelegationAddress = apiConfigService.getDelegationContractAddress();
        if (!getDelegationAddress) {
          expect(getDelegationAddress).toThrow('No Delegation contract present');
        }
      })
    });
  });
  describe('Get Delegation Contract ShardId', () => {
    describe('getDelegationContractShardId', () => {
      it('should return delegation contract ShardId', () => {
        const getDelegationShardId = apiConfigService.getDelegationContractShardId();
        expect(getDelegationShardId).toBe(2)
      })
      it('should throw error', async () => {
        const getDelegationShardId = apiConfigService.getDelegationContractShardId();
        if (!getDelegationShardId) {
          expect(getDelegationShardId).toThrow('No Delegation shardId present')
        }
      })
    });
  });
  describe('Get DelegationManager Contract Address', () => {
    describe('getDelegationManagerContractAddress', () => {
      it('should return delegation manager contract address', () => {
        const getDelegationManager = apiConfigService.getDelegationManagerContractAddress();
        expect(getDelegationManager).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6')
      })
      it('should throw error', async () => {
        const getDelegationManager = apiConfigService.getDelegationManagerContractAddress();
        if (!getDelegationManager) {
          expect(getDelegationManager).toThrow('No DelegationManager contract present');
        }
      })
    });
  });
  describe('Get Vm Query URL', () => {
    describe('getVmQueryUrl', () => {
      it('should return Vm Querry Url', () => {
        const getVmQuery = apiConfigService.getVmQueryUrl();
        expect(getVmQuery).toBe('https://gateway.elrond.com')
      })
      it('should throw error', async () => {
        const getVmQuery = apiConfigService.getVmQueryUrl();
        if (!getVmQuery) {
          expect(getVmQuery).toThrow('No VM Querry URL present');
        }
      })
    });
  });
  describe('Get Redis URL', () => {
    describe('getRedisUrl', () => {
      it('should return Redis Url', () => {
        const getRedis = apiConfigService.getRedisUrl();
        expect(getRedis).toBe('127.0.0.1')
      })
      it('should throw error', async () => {
        const getRedis = apiConfigService.getRedisUrl();
        if (!getRedis) {
          expect(getRedis).toThrow('No Redis URL present');
        }
      })
    });
  });
  describe('Get Cache Ttl', () => {
    describe('getCacheTtl', () => {
      it('should return cache Ttl', async () => {
        const getCache = apiConfigService.getCacheTtl();
        expect(getCache).toBe(6)
      })
      it('should throw error', async () => {
        const getCache = apiConfigService.getCacheTtl();
        if (!getCache) {
          expect(getCache).toThrow('No Cache Ttl present');
        }
      })
    });
  });
  describe('Get Network', () => {
    describe('getNetwork', () => {
      it('should return network', async () => {
        const getNetwork = apiConfigService.getNetwork();
        expect(getNetwork).toBe('mainnet')
      })
      it('should throw error', async () => {
        const getNetwork = apiConfigService.getNetwork();
        if (!getNetwork) {
          expect(getNetwork).toThrow('No Network present');
        }
      })
    });
  });
  describe('Get Pool Limit', () => {
    describe('getPoolLimit', () => {
      it('should return pool limit', async () => {
        const getPool = apiConfigService.getPoolLimit();
        expect(getPool).toBe(10)
      })
      it('should throw error', async () => {
        const getPool = apiConfigService.getPoolLimit();
        if (!getPool) {
          expect(getPool).toBe(100);
        }
      })
    });
  });
  describe('Get Process Ttl', () => {
    describe('getProcessTtl', () => {
      it('should return process Ttl', async () => {
        const getProcess = apiConfigService.getProcessTtl();
        expect(getProcess).toBe(600)
      })
      it('should throw error', async () => {
        const getProcess = apiConfigService.getProcessTtl();
        if (!getProcess) {
          expect(getProcess).toBe(60);
        }
      })
    });
  });
  describe('Get Axios Timeout', () => {
    describe('getAxiosTimeout', () => {
      it('should return Axios Timeout', async () => {
        const getAxios = apiConfigService.getAxiosTimeout();
        expect(getAxios).toBe(61000)
      })
      it('should throw error', async () => {
        const getAxios = apiConfigService.getAxiosTimeout();
        if (!getAxios) {
          expect(getAxios).toThrow('Throw error Axios Timeout');
        }
      })
    });
  });
  describe('Get Server Timeout', () => {
    describe('getServerTimeout', () => {
      it('should return Server Timeout', async () => {
        const getServer = apiConfigService.getServerTimeout();
        expect(getServer).toBe(60000)
      })
      it('should throw error', async () => {
        const getServer = apiConfigService.getServerTimeout();
        if (!getServer) {
          expect(getServer).toThrow('Throw error Server Timeout');
        }
      })
    });
  });
  describe('Get Headers Timeout', () => {
    describe('getHeadersTimeout', () => {
      it('should return headers Timeout', async () => {
        const getHeaders = apiConfigService.getHeadersTimeout();
        expect(getHeaders).toBe(61000)
      })
      it('should throw error', async () => {
        const getHeaders = apiConfigService.getHeadersTimeout();
        if (!getHeaders) {
          expect(getHeaders).toThrow('Throw error headers Timeout');
        }
      })
    });
  });
  describe('Get Use Request Catching Flag', () => {
    describe('getUseRequestCachingFlag', () => {
      it('should return catching flag True', async () => {
        const getUseRequestCaching = apiConfigService.getUseRequestCachingFlag();
        expect(getUseRequestCaching).toBeTruthy()
      })
      it('should return false', async () => {
        const getUseRequestCaching = apiConfigService.getUseRequestCachingFlag();
        if (!getUseRequestCaching) {
          expect(getUseRequestCaching).toBeFalsy();
        }
      })
    });
  });
  describe('Get Use Request Logging Flag', () => {
    describe('getUseRequestLoggingFlag', () => {
      it('should return logging flag False', async () => {
        const getUserRequestLogging = apiConfigService.getUseRequestLoggingFlag();
        expect(getUserRequestLogging).toBeFalsy()
      })
      it('should return true', async () => {
        const getUserRequestLogging = apiConfigService.getUseRequestLoggingFlag();
        if (getUserRequestLogging) {
          expect(getUserRequestLogging).toBeTruthy();
        }
      })
    });
  });
  describe('Get Use Keep Alive Agent Flag', () => {
    describe('getUseKeepAliveAgentFlag', () => {
      it('should return agent flag true', async () => {
        const getUseKeepAlice = apiConfigService.getUseKeepAliveAgentFlag();
        expect(getUseKeepAlice).toBeTruthy()
      })
      it('should return false', async () => {
        const getUseKeepAlice = apiConfigService.getUseKeepAliveAgentFlag();
        if (!getUseKeepAlice) {
          expect(getUseKeepAlice).toBeFalsy();
        }
      })
    });
  });
  describe('Get Use Tracing Flag', () => {
    describe('getUseTracingFlag', () => {
      it('should return tracing flag false', async () => {
        const getUseTracing = apiConfigService.getUseTracingFlag();
        expect(getUseTracing).toBeFalsy()
      })
      it('should return true', async () => {
        const getUseTracing = apiConfigService.getUseTracingFlag();
        if (getUseTracing) {
          expect(getUseTracing).toBeTruthy();
        }
      })
    });
  });
  describe('Get Use VmQuery tracing Flag', () => {
    describe('getUseVmQueryTracingFlag', () => {
      it('should return tracing flag false', async () => {
        const getUseVmQuery = apiConfigService.getUseVmQueryTracingFlag();
        expect(getUseVmQuery).toBeFalsy()
      })
      it('should return true', async () => {
        const getUseVmQuery = apiConfigService.getUseVmQueryTracingFlag();
        if (getUseVmQuery) {
          expect(getUseVmQuery).toBeTruthy();
        }
      })
    });
  });
  describe('Get Providers URL', () => {
    describe('getProvidersUrl', () => {
      it('should return provider url', async () => {
        const getProviders = apiConfigService.getProvidersUrl();
        expect(getProviders).toBe('https://internal-delegation-api.elrond.com/providers')
      })
      it('should throw new Error', async () => {
        const getProviders = apiConfigService.getProvidersUrl();
        if (!getProviders) {
          expect(getProviders).toThrow('No providers url present');
        }
      })
    });
  });
  describe('Get Data URL', () => {
    describe('getDataUrl', () => {
      it('should return provider url undefined', async () => {
        const getData = apiConfigService.getDataUrl();
        expect(getData).toBeUndefined();
      })
    });
  });

  describe('Get Is Transaction Processor Cron Active', () => {
    describe('getIsTransactionProcessorCronActive', () => {
      it('should return true', async () => {
        const getIsTransactionProcessor = apiConfigService.getIsTransactionProcessorCronActive();
        expect(getIsTransactionProcessor).toBeTruthy();
      })
      it('should throw new Error', async () => {
        const getIsTransactionProcessor = apiConfigService.getIsTransactionProcessorCronActive();
        let isCronActive = undefined;
        if (isCronActive) {
          expect(getIsTransactionProcessor).toThrow('No cron.transactionProcessor flag present');
        }
      })
      it('should return true', async () => {
        const getIsTransactionProcessor = apiConfigService.getIsTransactionProcessorCronActive();
        let isCronActive = undefined;
        if (!isCronActive) {
          expect(getIsTransactionProcessor).toBeTruthy();
        }
      })
    });
  });
  describe('Get Transaction Processor Max Look Behind', () => {
    describe('getTransactionProcessorMaxLookBehind', () => {
      it('should return max transaction processor (1000)', async () => {
        const getTransactionProcessorMax = apiConfigService.getTransactionProcessorMaxLookBehind();
        expect(getTransactionProcessorMax).toBe(1000);
      })
      it('should throw new Error', async () => {
        const getTransactionProcessorMax = apiConfigService.getTransactionProcessorMaxLookBehind();
        if (getTransactionProcessorMax == undefined) {
          expect(getTransactionProcessorMax).toThrow('No cron.transactionProcessorMaxLookBehind flag present');
        }
      })
    });
  });
  describe('Get Is Cache Warmer Cron Active', () => {
    describe('getIsCacheWarmerCronActive', () => {
      it('should return cache warmer cron', async () => {
        const getIsCacheWarmer = apiConfigService.getIsCacheWarmerCronActive();
        expect(getIsCacheWarmer).toBeTruthy()
      })
      it('should throw new Error', async () => {
        const getIsCacheWarmer = apiConfigService.getIsCacheWarmerCronActive();
        if (getIsCacheWarmer == undefined) {
          expect(getIsCacheWarmer).toThrow('No cron.cacheWarmer flag present');
        }
      })
    });
  });

  describe('Get Is Fast Warmer Cron Active', () => {
    describe('getIsFastWarmerCronActive', () => {
      it('should return fast warmer cron', async () => {
        const getIsFastWarmer = apiConfigService.getIsFastWarmerCronActive();
        expect(getIsFastWarmer).toBeFalsy();
      })
      it('should throw new Error', async () => {
        const getIsFastWarmer = apiConfigService.getIsFastWarmerCronActive();
        if (getIsFastWarmer == undefined) {
          expect(getIsFastWarmer).toThrow('No queue worker cron flag present');
        }
      })
    });
  });
  describe('Get Is Public API Active', () => {
    describe('getIsPublicApiActive', () => {
      it('should return boolean if Public API is active', async () => {
        const getIsPublicAPI = apiConfigService.getIsPublicApiActive();
        expect(getIsPublicAPI).toBeTruthy();
      })
      it('should throw new Error', async () => {
        const getIsPublicAPI = apiConfigService.getIsPublicApiActive();
        if (getIsPublicAPI == undefined) {
          expect(getIsPublicAPI).toThrow('No api public flag present');
        }
      })
    });
  });
  describe('Get Is Private API Active', () => {
    describe('getIsPrivateApiActive', () => {
      it('should return boolean if Private API is active', async () => {
        const getIsPrivate = apiConfigService.getIsPrivateApiActive();
        expect(getIsPrivate).toBeTruthy();
      })
      it('should throw new Error', async () => {
        const getIsPrivate = apiConfigService.getIsPrivateApiActive();
        if (getIsPrivate == undefined) {
          expect(getIsPrivate).toThrow('No api private flag present');
        }
      })
    });
  });
  describe('Get Is Auth Active', () => {
    describe('getIsAuthActive', () => {
      it('should return boolean if auth is active', async () => {
        const getIsAuth = apiConfigService.getIsAuthActive();
        expect(getIsAuth).toBeFalsy();
      })
    });
  });
  describe('Get Database Host', () => {
    describe('getDatabaseHost', () => {
      it('should return database host', async () => {
        const getDatabaseH = apiConfigService.getDatabaseHost();
        expect(getDatabaseH).toBe('localhost');
      })
      it('should throw new Error', async () => {
        const getDatabaseH = apiConfigService.getDatabaseHost();
        if (!getDatabaseH) {
          expect(getDatabaseH).toThrow('No database.host present');
        }
      })
    });
  });
  describe('Get Database Port', () => {
    describe('getDatabasePort', () => {
      it('should return database port', async () => {
        const getDatabaseP = apiConfigService.getDatabasePort();
        expect(getDatabaseP).toBe(3306);
      })
      it('should throw new Error', async () => {
        const getDatabaseP = apiConfigService.getDatabasePort();
        if (!getDatabaseP) {
          expect(getDatabaseP).toThrow('No database port present');
        }
      })
    });
  });
  describe('Get Database UserName', () => {
    describe('getDatabaseUsername', () => {
      it('should return database username', async () => {
        const getDatabaseU = apiConfigService.getDatabaseUsername();
        expect(getDatabaseU).toBe('root');
      })
      it('should throw new Error', async () => {
        const getDatabaseU = apiConfigService.getDatabaseUsername();
        if (!getDatabaseU) {
          expect(getDatabaseU).toThrow('No database username present');
        }
      })
    });
  });
  describe('Get Database Password', () => {
    describe('getDatabasePassword', () => {
      it('should return database password', async () => {
        const getDatabaseP = apiConfigService.getDatabasePassword();
        expect(getDatabaseP).toBe('root');
      })
    });
  });
  describe('Get Database Name', () => {
    describe('getDatabaseName', () => {
      it('should return database name', async () => {
        const getDatabaseN = apiConfigService.getDatabaseName();
        expect(getDatabaseN).toBe('api');
      })
      it('should throw new Error', async () => {
        const getDatabaseN = apiConfigService.getDatabaseName();
        if (!getDatabaseN) {
          expect(getDatabaseN).toThrow('No database name present');
        }
      })
    });
  });
  describe('Get Metachain Shard Id', () => {
    describe('getMetaChainShardId', () => {
      it('should return metachain shard id', async () => {
        const getMetachain = apiConfigService.getMetaChainShardId();
        expect(getMetachain).toBe(4294967295);
      })
    });
  });
  describe('Get Use Legacy Elastic', () => {
    describe('getUseLegacyElastic', () => {
      it('should return true', async () => {
        const getUseLegacy = apiConfigService.getUseLegacyElastic();
        expect(getUseLegacy).toBeTruthy();
      })
      it('should be false', async () => {
        const getUseLegacy = apiConfigService.getUseLegacyElastic();
        if (getUseLegacy == undefined) {
          expect(getUseLegacy).toBeFalsy();
        }
      })
    });
  });
  describe('Get Use Rate Limiter Secret', () => {
    describe('getRateLimiterSecret', () => {
      it('should return rate limiter secret', async () => {
        const getRate = apiConfigService.getRateLimiterSecret();
        expect(getRate).toBeUndefined();
      })
    });
  });
  describe('Get Inflation Amounts', () => {
    describe('getInflationAmounts', () => {
      it('should return array of inflation amounts', async () => {
        const getInflation = apiConfigService.getInflationAmounts();
        expect(getInflation).toBeInstanceOf(Array);
      })
      it('should return an error', async () => {
        const getInflation = apiConfigService.getInflationAmounts();
        if (!getInflation) {
          expect(getInflation).toThrow('No inflation amounts present');
        }
      })
    });
  });
  describe('Get Media Url', () => {
    describe('getMediaUrl', () => {
      it('should return media url', async () => {
        const getMedia = apiConfigService.getMediaUrl();
        expect(getMedia).toBe('https://media.elrond.com');
      })
      it('should return an error', async () => {
        const getMedia = apiConfigService.getMediaUrl();
        if (!getMedia) {
          expect(getMedia).toThrow('No media url present');
        }
      })
    });
  });

  describe('Get Media Internal URL', () => {
    describe('getMediaInternalUrl', () => {
      it('should return media internal url', async () => {
        const getMediaInternal = apiConfigService.getMediaInternalUrl();
        expect(getMediaInternal).toBeUndefined();
      })
    });
  });
  describe('Get External Media Url', () => {
    describe('getExternalMediaUrl', () => {
      it('should return external media url', async () => {
        const getExternalMedia = apiConfigService.getExternalMediaUrl();
        expect(getExternalMedia).toBe('https://media.elrond.com');
      })
      it('should return url without (.) if exist', async () => {
        const getExternalMedia = apiConfigService.getExternalMediaUrl();
        if (getExternalMedia.endsWith('.')) {
          expect(getExternalMedia).toBe('https://media.elrond.com');
        }
      })
    });
  });
  describe('Get Nft Thumbnails URL', () => {
    describe('getNftThumbnailsUrl', () => {
      it('should return nft thumbnails url', async () => {
        const getNftThumbnails = apiConfigService.getNftThumbnailsUrl();
        expect(getNftThumbnails).toBe('https://media.elrond.com/nfts/thumbnail');
      })
      it('should return an error', async () => {
        const getNftThumbnails = apiConfigService.getNftThumbnailsUrl();
        if (!getNftThumbnails) {
          expect(getNftThumbnails).toThrow('No nft thumbnails url present');
        }
      })
    });
  });
  describe('Get Access Address', () => {
    describe('getAccessAddress', () => {
      it('should return access address', async () => {
        const getAcces = apiConfigService.getAccessAddress();
        expect(getAcces).toBe('');
      })
    });
  });
})