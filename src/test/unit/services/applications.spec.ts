import { Test, TestingModule } from '@nestjs/testing';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';
import { ApplicationFilter } from 'src/endpoints/applications/entities/application.filter';
import { AssetsService } from '../../../common/assets/assets.service';
import { AccountAssetsSocial } from '../../../common/assets/entities/account.assets.social';
import { AccountAssets } from '../../../common/assets/entities/account.assets';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { ApplicationsService } from 'src/endpoints/applications/applications.service';
import { Applications } from 'src/endpoints/applications/entities/applications';

describe.skip('ApplicationService', () => {
  let service: ApplicationsService;
  let indexerService: ElasticIndexerService;
  let assetsService: AssetsService;
  let gatewayService: GatewayService;
  let cacheService: CacheService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: ElasticIndexerService,
          useValue: {
            getApplications: jest.fn(),
            getApplicationCount: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getAllAccountAssets: jest.fn(),
          },
        },
        {
          provide: GatewayService,
          useValue: {
            getAddressDetails: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    indexerService = module.get<ElasticIndexerService>(ElasticIndexerService);
    assetsService = module.get<AssetsService>(AssetsService);
    gatewayService = module.get<GatewayService>(GatewayService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApplications', () => {
    it('should return an array of applications', async () => {
      const indexResult = [
        {
          address: 'erd1qqqqqqqqqqqqqpgq8372f63glekg7zl22tmx7wzp4drql25r6avs70dmp0',
          deployer: 'erd1j770k2n46wzfn5g63gjthhqemu9r23n9tp7seu95vpz5gk5s6avsk5aams',
          currentOwner: 'erd1j770k2n46wzfn5g63gjthhqemu9r23n9tp7seu95vpz5gk5s6avsk5aams',
          initialCodeHash: 'kDh8hR9vyceELMUuy6JdAg0X90+ZaLeyVQS6tPbY82s=',
          timestamp: 1724955216,
        },
        {
          address: 'erd1qqqqqqqqqqqqqpgquc4v0pujmewzr26tm2gtawmsq4vsrm4mwmfs459g65',
          deployer: 'erd1szcgm7vq3tmyxfgd4wd2k2emh59az8jq5jjpj9799a0k59u0wmfss4vw3v',
          currentOwner: 'erd1szcgm7vq3tmyxfgd4wd2k2emh59az8jq5jjpj9799a0k59u0wmfss4vw3v',
          initialCodeHash: 'kDiPwFRJhcB7TmeBbQvw1uWQ8vuhRSU6XF71Z4OybeQ=',
          timestamp: 1725017514,
        },
      ];

      const assets: { [key: string]: AccountAssets } = {
        erd1qqqqqqqqqqqqqpgq8372f63glekg7zl22tmx7wzp4drql25r6avs70dmp0: {
          name: 'Multiversx DNS: Contract 239',
          description: '',
          social: new AccountAssetsSocial({
            website: 'https://xexchange.com',
            twitter: 'https://twitter.com/xExchangeApp',
            telegram: 'https://t.me/xExchangeApp',
            blog: 'https://multiversx.com/blog/maiar-exchange-mex-tokenomics',
          }),
          tags: ['dns'],
          icon: 'multiversx',
          iconPng: '',
          iconSvg: '',
          proof: '',
        },
      };

      jest.spyOn(indexerService, 'getApplications').mockResolvedValue(indexResult);
      jest.spyOn(assetsService, 'getAllAccountAssets').mockResolvedValue(assets);
      jest.spyOn(gatewayService, 'getAddressDetails').mockResolvedValue({
        account: {
          address: '',
          nonce: 0,
          balance: '0',
          username: '',
          code: '',
          codeHash: '',
          rootHash: '',
          codeMetadata: '',
          developerReward: '',
          ownerAddress: '',
        },
      });

      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter();
      const result = await service.getApplicationsRaw(queryPagination, filter);

      expect(indexerService.getApplications).toHaveBeenCalledWith(filter, queryPagination);
      expect(indexerService.getApplications).toHaveBeenCalledTimes(1);
      expect(assetsService.getAllAccountAssets).toHaveBeenCalled();

      const expectedApplications = indexResult.map(item => new Applications({
        address: item.address,
        balance: '0',
        usersCount: 0,
        feesCaptured: '0',
        deployedAt: 0,
        deployTxHash: '',
        isVerified: false,
        txCount: 0,
        assets: assets[item.address],
      }));

      expect(result).toEqual(expectedApplications);
    });

    it('should return an empty array if no applications are found', async () => {
      jest.spyOn(indexerService, 'getApplications').mockResolvedValue([]);

      const queryPagination = new QueryPagination;
      const filter = new ApplicationFilter;
      const result = await service.getApplications(queryPagination, filter);

      expect(indexerService.getApplications)
        .toHaveBeenCalledWith(filter, queryPagination);
      expect(indexerService.getApplications)
        .toHaveBeenCalledTimes(1);

      expect(result).toEqual([]);
    });

    it('should return an empty array of applications from cache', async () => {
      const queryPagination = new QueryPagination();
      const filter = new ApplicationFilter();
      jest.spyOn(cacheService, 'getOrSet').mockResolvedValue([]);
      const result = await service.getApplications(queryPagination, filter);
      expect(result).toEqual([]);
    });
  });

  describe('getApplicationsCount', () => {
    it('should return total applications count', async () => {
      jest.spyOn(indexerService, 'getApplicationCount').mockResolvedValue(2);

      const filter = new ApplicationFilter;
      const result = await service.getApplicationsCount(filter);

      expect(indexerService.getApplicationCount)
        .toHaveBeenCalledWith(filter);
      expect(indexerService.getApplicationCount)
        .toHaveBeenCalledTimes(1);

      expect(result).toEqual(2);
    });
  });
});
