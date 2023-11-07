import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { LockedAssetService } from "src/common/locked-asset/locked-asset.service";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftMediaService } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import { NftMetadataService } from "src/queue.worker/nft.worker/queue/job-services/metadata/nft.metadata.service";

describe('NftService', () => {
  let service: NftService;
  let indexerService: IndexerService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NftService,
        {
          provide: ApiConfigService,
          useValue: {
            getExternalMediaUrl: jest.fn(),
            isNftExtendedAttributesEnabled: jest.fn(),
            getIsIndexerV3FlagActive: jest.fn(),
            getNftExtendedAttributesNsfwThreshold: jest.fn(),
          },
        },
        {
          provide: IndexerService,
          useValue: {
            getNfts: jest.fn(),
            getNftOwnersCount: jest.fn(),
            getNftCount: jest.fn(),
            getAccountEsdtByIdentifiers: jest.fn(),
            getAccountsEsdtByCollection: jest.fn(),
          },
        },
        {
          provide: EsdtService,
          useValue: {
            getTokenSupply: jest.fn(),
            getEsdtTokenProperties: jest.fn(),
          },
        },
        {
          provide: AssetsService,
          useValue: {
            getTokenAssets: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            batchApplyAll: jest.fn(),
            batchApply: jest.fn(),
            getOrSet: jest.fn(),
          },
        },
        {
          provide: PluginService,
          useValue: {
            processNfts: jest.fn(),
            batchApply: jest.fn(),
          },
        },
        {
          provide: NftMetadataService,
          useValue: {
            getMetadata: jest.fn(),
          },
        },
        {
          provide: NftMediaService,
          useValue: {
            getMedia: jest.fn(),
          },
        },
        {
          provide: PersistenceService,
          useValue: {
            batchGetMedia: jest.fn(),
            batchGetMetadata: jest.fn(),
          },
        },
        {
          provide: EsdtAddressService,
          useValue: {
            getNftsForAddress: jest.fn(),
            getNftCountForAddressFromElastic: jest.fn(),
          },
        },
        {
          provide: MexTokenService,
          useValue: {
            getMexPrices: jest.fn(),
          },
        },
        {
          provide: LockedAssetService,
          useValue: {
            getLkmexUnlockSchedule: jest.fn(),
            getXmexUnlockEpoch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<NftService>(NftService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNftOwnersCountRaw', () => {
    it('should return NFT owner count raw', async () => {
      jest.spyOn(service, 'isNft').mockResolvedValue(true);
      jest.spyOn(indexerService, 'getNftOwnersCount').mockResolvedValue(10);

      const identifier = 'XDAY23TEAM-f7a346-01';
      const result = await service.getNftOwnersCountRaw(identifier);

      expect(result).toStrictEqual(10);
      expect(service.isNft).toHaveBeenCalledWith(identifier);
      expect(indexerService.getNftOwnersCount).toHaveBeenCalledWith(identifier);
      expect(indexerService.getNftOwnersCount).toHaveBeenCalledTimes(1);
    });

    it('should return null because test simulates that given identifier is not a valid NFT', async () => {
      jest.spyOn(service, 'isNft').mockResolvedValue(false);

      const identifier = 'XDAY23TEAM-f7a346-0102';
      const result = await service.getNftOwnersCountRaw(identifier);

      expect(result).toBeNull();
    });
  });
});
