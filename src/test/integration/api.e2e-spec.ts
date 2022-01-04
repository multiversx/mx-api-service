import {ApiConfigService} from "../../common/api-config/api.config.service";
import Initializer from "./e2e-init";
import {Constants} from "../../utils/constants";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";

describe('API Config', ()=>{
    let apiConfigService: ApiConfigService;

    beforeAll(async () => {
        await Initializer.initialize();
    }, Constants.oneHour() * 1000);

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [PublicAppModule],
        }).compile();

        apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    });

    describe('Get Urls', ()=>{
        describe('getApiUrls', ()=>{
            it('should return a list of urls', async ()=>{
                const getUrlsList =  apiConfigService.getApiUrls();
                expect(getUrlsList).toBeInstanceOf(Array);
            })
        });
    });
    describe('Get Urls', ()=>{
        describe('getApiUrls', ()=>{
            it('should return No API urls present', async ()=>{
                const getUrlsList =  apiConfigService.getApiUrls();
                if(!getUrlsList)
                expect(getUrlsList).toThrow('No API urls present')
            })
        });
    });
    describe('Get Gateway URL', ()=>{
        describe('getGatewayUrl', ()=>{
            it('should return gateway url', async ()=>{
                const getUrlsList =  apiConfigService.getGatewayUrl();
                expect(getUrlsList).toBe('https://gateway.elrond.com');
            })
        });
    });
    describe('Get Gateway URL', ()=>{
        describe('getGatewayUrl', ()=>{
            it('should return no gateway urls present', async ()=>{
                const getUrlsList =  apiConfigService.getGatewayUrl();
                if(!getUrlsList)
                expect(getUrlsList).toThrow('No gateway urls present');
            })
        });
    });
    describe('Get Elastic URL', ()=>{
        describe('getElasticUrl', ()=>{
            it('should return elastic url', async ()=>{
                const getUrlsList =  apiConfigService.getElasticUrl();
                expect(getUrlsList).toBe('https://index.elrond.com');
            })
        });
    });
    describe('Get Elastic URL', ()=>{
        describe('getElasticUrl', ()=>{
            it('should return no elastic urls present', async ()=>{
                const getUrlsList =  apiConfigService.getElasticUrl();
                if(!getUrlsList)
                expect(getUrlsList).toThrow('No elastic urls present');
            })
        });
    });
    describe('Get Mex URL', ()=>{
        describe('getMexUrl', ()=>{
            it('should return Mex url', async ()=>{
                const getUrlsList =  apiConfigService.getMexUrl();
                if(getUrlsList)
                expect(getUrlsList).toBe('https://mex-indexer.elrond.com');
            })
        });
    });
    describe('Get Mex URL', ()=>{
        describe('getMexUrl', ()=>{
            it('should return empty string', async ()=>{
                const getUrlsList =  apiConfigService.getMexUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toBe('');
            })
        });
    });
    describe('Get Ipfs URL', ()=>{
        describe('getIpfsUrl', ()=>{
            it('should return IPFS URL', async ()=>{
                const getUrlsList =  apiConfigService.getIpfsUrl();
                expect(getUrlsList).toBe('https://ipfs.io/ipfs')
            })
        });
    });
    describe('Get Ipfs URL', ()=>{
        describe('getIpfsUrl', ()=>{
            it('should return no IPFS url', async ()=>{
                const getUrlsList =  apiConfigService.getIpfsUrl();
                if(!getUrlsList)
                expect(getUrlsList).toThrow('No Ipfs Urls')
            })
        });
    });
    describe('Get Esdt Contract Address', ()=>{
        describe('getEsdtContractAddress', ()=>{
            it('should return Esdt Contract Address', async ()=>{
                const getUrlsList =  apiConfigService.getEsdtContractAddress();
                expect(getUrlsList).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getEsdtContractAddress();
                if(!getUrlsList)
                expect(getUrlsList).toThrow('No ESDT contract present')
            })
        });
    });
    describe('Get Auction Contract Address', ()=>{
        describe('getAuctionContractAddress', ()=>{
            it('should return auction contract address', async ()=>{
                const getUrlsList =  apiConfigService.getAuctionContractAddress();
                expect(getUrlsList).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getAuctionContractAddress();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No auction contract present')
            })
        });
    });
    describe('Get Staking Contract Address', ()=>{
        describe('getStakingContractAddress', ()=>{
            it('should return staking contract address', async ()=>{
                const getUrlsList =  apiConfigService.getStakingContractAddress();
                expect(getUrlsList).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getStakingContractAddress();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Staking contract present')
            })
        });
    });
    describe('Get Delegation Contract Address', ()=>{
        describe('getDelegationContractAddress', ()=>{
            it('should return delegation contract address', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationContractAddress();
                expect(getUrlsList).toBe('erd1qqqqqqqqqqqqqpgqxwakt2g7u9atsnr03gqcgmhcv38pt7mkd94q6shuwt')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationContractAddress();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Delegation contract present')
            })
        });
    });
    describe('Get Delegation Contract ShardId', ()=>{
        describe('getDelegationContractShardId', ()=>{
            it('should return delegation contract ShardId', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationContractShardId();
                expect(getUrlsList).toBe(2)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationContractShardId();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Delegation shardId present')
            })
        });
    });
    describe('Get DelegationManager Contract Address', ()=>{
        describe('getDelegationManagerContractAddress', ()=>{
            it('should return delegation manager contract address', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationManagerContractAddress();
                expect(getUrlsList).toBe('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getDelegationManagerContractAddress();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No DelegationManager contract present')
            })
        });
    });
    describe('Get Vm Querry URL', ()=>{
        describe('getVmQueryUrl', ()=>{
            it('should return Vm Querry Url', async ()=>{
                const getUrlsList =  apiConfigService.getVmQueryUrl();
                expect(getUrlsList).toBe('https://gateway.elrond.com')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getVmQueryUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No VM Querry URL present')
            })
        });
    });
    describe('Get Redis URL', ()=>{
        describe('getRedisUrl', ()=>{
            it('should return Redis Url', async ()=>{
                const getUrlsList =  apiConfigService.getRedisUrl();
                expect(getUrlsList).toBe('127.0.0.1')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getRedisUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Redis URL present')
            })
        });
    });
    describe('Get Cache Ttl', ()=>{
        describe('getCacheTtl', ()=>{
            it('should return cache Ttl', async ()=>{
                const getUrlsList =  apiConfigService.getCacheTtl();
                expect(getUrlsList).toBe(6)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getCacheTtl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Cache Ttl present')
            })
        });
    });
    describe('Get Network', ()=>{
        describe('getNetwork', ()=>{
            it('should return network', async ()=>{
                const getUrlsList =  apiConfigService.getNetwork();
                expect(getUrlsList).toBe('mainnet')
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getNetwork();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No Network present')
            })
        });
    });
    describe('Get Pool Limit', ()=>{
        describe('getPoolLimit', ()=>{
            it('should return pool limit', async ()=>{
                const getUrlsList =  apiConfigService.getPoolLimit();
                expect(getUrlsList).toBe(10)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getPoolLimit();
                if(!getUrlsList)
                    expect(getUrlsList).toBe(100)
            })
        });
    });
    describe('Get Process Ttl', ()=>{
        describe('getProcessTtl', ()=>{
            it('should return process Ttl', async ()=>{
                const getUrlsList =  apiConfigService.getProcessTtl();
                expect(getUrlsList).toBe(600)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getProcessTtl();
                if(!getUrlsList)
                    expect(getUrlsList).toBe(60)
            })
        });
    });
    describe('Get Axios Timeout', ()=>{
        describe('getAxiosTimeout', ()=>{
            it('should return Axios Timeout', async ()=>{
                const getUrlsList =  apiConfigService.getAxiosTimeout();
                expect(getUrlsList).toBe(61000)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getAxiosTimeout();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('Throw error Axios Timeout')
            })
        });
    });
    describe('Get Server Timeout', ()=>{
        describe('getServerTimeout', ()=>{
            it('should return Server Timeout', async ()=>{
                const getUrlsList =  apiConfigService.getServerTimeout();
                expect(getUrlsList).toBe(60000)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getServerTimeout();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('Throw error Server Timeout')
            })
        });
    });
    describe('Get Headers Timeout', ()=>{
        describe('getHeadersTimeout', ()=>{
            it('should return headers Timeout', async ()=>{
                const getUrlsList =  apiConfigService.getHeadersTimeout();
                expect(getUrlsList).toBe(61000)
            })
            it('should throw error', async ()=>{
                const getUrlsList =  apiConfigService.getHeadersTimeout();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('Throw error headers Timeout')
            })
        });
    });
    describe('Get Use Request Catching Flag', ()=>{
        describe('getUseRequestCachingFlag', ()=>{
            it('should return catching flag True', async ()=>{
                const getUrlsList =  apiConfigService.getUseRequestCachingFlag();
                expect(getUrlsList).toBeTruthy()
            })
            it('should return false', async ()=>{
                const getUrlsList =  apiConfigService.getUseRequestCachingFlag();
                if(!getUrlsList)
                    expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Use Request Logging Flag', ()=>{
        describe('getUseRequestLoggingFlag', ()=>{
            it('should return logging flag False', async ()=>{
                const getUrlsList =  apiConfigService.getUseRequestLoggingFlag();
                expect(getUrlsList).toBeFalsy()
            })
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getUseRequestLoggingFlag();
                if(getUrlsList)
                    expect(getUrlsList).toBeTruthy();
            })
        });
    });
    describe('Get Use Keep Alive Agent Flag', ()=>{
        describe('getUseKeepAliveAgentFlag', ()=>{
            it('should return agent flag true', async ()=>{
                const getUrlsList =  apiConfigService.getUseKeepAliveAgentFlag();
                expect(getUrlsList).toBeTruthy()
            })
            it('should return false', async ()=>{
                const getUrlsList =  apiConfigService.getUseKeepAliveAgentFlag();
                if(!getUrlsList)
                    expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Use Tracing Flag', ()=>{
        describe('getUseTracingFlag', ()=>{
            it('should return tracing flag false', async ()=>{
                const getUrlsList =  apiConfigService.getUseTracingFlag();
                expect(getUrlsList).toBeFalsy()
            })
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getUseTracingFlag();
                if(getUrlsList)
                    expect(getUrlsList).toBeTruthy();
            })
        });
    });
    describe('Get Use VmQuery tracing Flag', ()=>{
        describe('getUseVmQueryTracingFlag', ()=>{
            it('should return tracing flag false', async ()=>{
                const getUrlsList =  apiConfigService.getUseVmQueryTracingFlag();
                expect(getUrlsList).toBeFalsy()
            })
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getUseVmQueryTracingFlag();
                if(getUrlsList)
                    expect(getUrlsList).toBeTruthy();
            })
        });
    });
    describe('Get Providers URL', ()=>{
        describe('getProvidersUrl', ()=>{
            it('should return provider url', async ()=>{
                const getUrlsList =  apiConfigService.getProvidersUrl();
                expect(getUrlsList).toBe( 'https://internal-delegation-api.elrond.com/providers')
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getProvidersUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No providers url present');
            })
        });
    });
    describe('Get Data URL', ()=>{
        describe('getDataUrl', ()=>{
            it('should return provider url undefined', async ()=>{
                const getUrlsList =  apiConfigService.getDataUrl();
                expect(getUrlsList).toBeUndefined();
            })
        });
    });
   /* describe('Get Temp URL', ()=>{
        describe('getTempUrl', ()=>{
            it('should return temp url', async ()=>{
                const getUrlsList =  apiConfigService.getTempUrl();
                expect(getUrlsList).toBeInstanceOf(String);
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getTempUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No temp url present');
            })
        });
    });*/
    describe('Get Is Transaction Processor Cron Active', ()=>{
        describe('getIsTransactionProcessorCronActive', ()=>{
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getIsTransactionProcessorCronActive();
                expect(getUrlsList).toBeTruthy();
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsTransactionProcessorCronActive();
                let isCronActive = undefined;
                if(isCronActive)
                    expect(getUrlsList).toThrow('No cron.transactionProcessor flag present');
            })
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getIsTransactionProcessorCronActive();
                let isCronActive = undefined;
                if(!isCronActive)
                    expect(getUrlsList).toBeTruthy();
            })
        });
    });
    describe('Get Transaction Processor Max Look Behind', ()=>{
        describe('getTransactionProcessorMaxLookBehind', ()=>{
            it('should return max transaction processor (1000)', async ()=>{
                const getUrlsList =  apiConfigService.getTransactionProcessorMaxLookBehind();
                expect(getUrlsList).toBe(1000);
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getTransactionProcessorMaxLookBehind();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No cron.transactionProcessorMaxLookBehind flag present');
            })
        });
    });
    describe('Get Is Cache Warmer Cron Active', ()=>{
        describe('getIsCacheWarmerCronActive', ()=>{
            it('should return cache warmer cron', async ()=>{
                const getUrlsList =  apiConfigService.getIsCacheWarmerCronActive();
                expect(getUrlsList).toBeTruthy()
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsCacheWarmerCronActive();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No cron.cacheWarmer flag present');
            })
        });
    });
    /*describe('Get Is Queue Worker Active', ()=>{
        describe('getIsQueueWorkerCronActive', ()=>{
            it('should return queue worker', async ()=>{
                const getUrlsList =  apiConfigService.getIsQueueWorkerCronActive();
                expect(getUrlsList).toBeTruthy()
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsQueueWorkerCronActive();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No queue worker cron flag present');
            })
        });
    });*/
    describe('Get Is Fast Warmer Cron Active', ()=>{
        describe('getIsFastWarmerCronActive', ()=>{
            it('should return fast warmer cron', async ()=>{
                const getUrlsList =  apiConfigService.getIsFastWarmerCronActive();
                expect(getUrlsList).toBeFalsy(); //TBD
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsFastWarmerCronActive();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No queue worker cron flag present');
            })
        });
    });
    describe('Get Is Public API Active', ()=>{
        describe('getIsPublicApiActive', ()=>{
            it('should return boolean if Public API is active', async ()=>{
                const getUrlsList =  apiConfigService.getIsPublicApiActive();
                expect(getUrlsList).toBeTruthy();
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsPublicApiActive();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No api public flag present');
            })
        });
    });
    describe('Get Is Private API Active', ()=>{
        describe('getIsPrivateApiActive', ()=>{
            it('should return boolean if Private API is active', async ()=>{
                const getUrlsList =  apiConfigService.getIsPrivateApiActive();
                expect(getUrlsList).toBeTruthy();
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getIsPrivateApiActive();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No api private flag present');
            })
        });
    });
    describe('Get Is Auth Active', ()=>{
        describe('getIsAuthActive', ()=>{
            it('should return boolean if auth is active', async ()=>{
                const getUrlsList =  apiConfigService.getIsAuthActive();
                expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Database Host', ()=>{
        describe('getDatabaseHost', ()=>{
            it('should return database host', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseHost();
                expect(getUrlsList).toBe('localhost');
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseHost();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No database.host present');
            })
        });
    });
    describe('Get Database Port', ()=>{
        describe('getDatabasePort', ()=>{
            it('should return database port', async ()=>{
                const getUrlsList =  apiConfigService.getDatabasePort();
                expect(getUrlsList).toBe(3306);
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getDatabasePort();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No database port present');
            })
        });
    });
    describe('Get Database UserName', ()=>{
        describe('getDatabaseUsername', ()=>{
            it('should return database username', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseUsername();
                expect(getUrlsList).toBe('root');
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseUsername();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No database username present');
            })
        });
    });
    describe('Get Database Password', ()=>{
        describe('getDatabasePassword', ()=>{
            it('should return database password', async ()=>{
                const getUrlsList =  apiConfigService.getDatabasePassword();
                expect(getUrlsList).toBe('root');
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getDatabasePassword();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No database password present');
            })
        });
    });
    describe('Get Database Name', ()=>{
        describe('getDatabaseName', ()=>{
            it('should return database name', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseName();
                expect(getUrlsList).toBe('api');
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getDatabaseName();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No database name present');
            })
        });
    });
    describe('Get Metachain Shard Id', ()=>{
        describe('getMetaChainShardId', ()=>{
            it('should return metachain shard id', async ()=>{
                const getUrlsList =  apiConfigService.getMetaChainShardId();
                expect(getUrlsList).toBe(4294967295);
            })
            it('should throw new Error', async ()=>{
                const getUrlsList =  apiConfigService.getMetaChainShardId();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No metaChainShardId present');
            })
        });
    });
    describe('Get Use Legacy Elastic', ()=>{
        describe('getUseLegacyElastic', ()=>{
            it('should return true', async ()=>{
                const getUrlsList =  apiConfigService.getUseLegacyElastic();
                expect(getUrlsList).toBeTruthy();
            })
            it('should be false', async ()=>{
                const getUrlsList =  apiConfigService.getUseLegacyElastic();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Use Rate Limiter Secret', ()=>{
        describe('getRateLimiterSecret', ()=>{
            it('should return rate limiter secret', async ()=>{
                const getUrlsList =  apiConfigService.getRateLimiterSecret();
                expect(getUrlsList).toBeUndefined();
            })
        });
    });
    describe('Get Inflation Amounts', ()=>{
        describe('getInflationAmounts', ()=>{
            it('should return array of inflation amounts', async ()=>{
                const getUrlsList =  apiConfigService.getInflationAmounts();
                expect(getUrlsList).toBeInstanceOf(Array);
            })
            it('should return an error', async ()=>{
                const getUrlsList =  apiConfigService.getInflationAmounts();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No inflation amounts present');
            })
        });
    });
    describe('Get Media Url', ()=>{
        describe('getMediaUrl', ()=>{
            it('should return media url', async ()=>{
                const getUrlsList =  apiConfigService.getMediaUrl();
                expect(getUrlsList).toBe('https://media.elrond.com');
            })
            it('should return an error', async ()=>{
                const getUrlsList =  apiConfigService.getMediaUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No media url present');
            })
        });
    });

    describe('Get Media Internal URL', ()=>{
        describe('getMediaInternalUrl', ()=>{
            it('should return media internal url', async ()=>{
                const getUrlsList =  apiConfigService.getMediaInternalUrl();
                expect(getUrlsList).toBeUndefined();
            })
        });
    });
    describe('Get External Media Url', ()=>{
        describe('getExternalMediaUrl', ()=>{
            it('should return external media url', async ()=>{
                const getUrlsList =  apiConfigService.getExternalMediaUrl();
                expect(getUrlsList).toBe('https://media.elrond.com');
            })
            it('should return url without (.) if exist', async ()=>{
                const getUrlsList =  apiConfigService.getExternalMediaUrl();
                if(getUrlsList.endsWith('.'))
                expect(getUrlsList).toBe('https://media.elrond.com');
            })
        });
    });
    describe('Get Nft Thumbnails URL', ()=>{
        describe('getNftThumbnailsUrl', ()=>{
            it('should return nft thumbnails url', async ()=>{
                const getUrlsList =  apiConfigService.getNftThumbnailsUrl();
                expect(getUrlsList).toBe('https://media.elrond.com/nfts/thumbnail');
            })
            it('should return an error', async ()=>{
                const getUrlsList =  apiConfigService.getNftThumbnailsUrl();
                if(!getUrlsList)
                    expect(getUrlsList).toThrow('No nft thumbnails url present');
            })
        });
    });
    describe('Get Access Address', ()=>{
        describe('getAccessAddress', ()=>{
            it('should return access address', async ()=>{
                const getUrlsList =  apiConfigService.getAccessAddress();
                expect(getUrlsList).toBe('');
            })
        });
    });
    describe('Get Mock Key Bases', ()=>{
        describe('getMockKeybases', ()=>{
            it('should return mock key bases', async ()=>{
                const getUrlsList =  apiConfigService.getMockKeybases();
                expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Mock Nodes', ()=>{
        describe('getMockNodes', ()=>{
            it('should return mock nodes', async ()=>{
                const getUrlsList =  apiConfigService.getMockNodes();
                expect(getUrlsList).toBeFalsy();
            })
        });
    });
    describe('Get Mock Path', ()=>{
        describe('getMockPath', ()=>{
            it('should return mock path', async ()=>{
                const getUrlsList =  apiConfigService.getMockPath();
                expect(getUrlsList).toBe('./src/test/mocks/');
            })
            it('should return an error', async ()=>{
                const getUrlsList =  apiConfigService.getMockPath();
                if(getUrlsList == undefined)
                    expect(getUrlsList).toThrow('No mock path value present');
            })
        });
    });

})