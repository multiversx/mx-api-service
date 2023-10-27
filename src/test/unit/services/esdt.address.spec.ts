import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { TokenAssetStatus } from "src/endpoints/tokens/entities/token.asset.status";

describe('EsdtAddressService', () => {
  let service: EsdtAddressService;
  let indexerService: IndexerService;
  let apiConfigService: ApiConfigService;
  let collectionService: CollectionService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EsdtAddressService,
        {
          provide: IndexerService, useValue: {
            getNftCountForAddress: jest.fn(),
            getCollectionCountForAddress: jest.fn(),
            getNftsForAddress: jest.fn(),
            getNftCollections: jest.fn(),
          },
        },
        {
          provide: ApiConfigService, useValue:
          {
            getExternalMediaUrl: jest.fn(),
            getIsIndexerV3FlagActive: jest.fn(),
          },
        },
        {
          provide: EsdtService, useValue: {
            getEsdtTokenProperties: jest.fn(),
          },
        },
        {
          provide: GatewayService, useValue: {
            get: jest.fn(),
            getAddressEsdtRoles: jest.fn(),
          },
        },
        {
          provide: CacheService, useValue: {
            get: jest.fn(),
            set: jest.fn(),
            getLocal: jest.fn(),
            setLocal: jest.fn(),
          },
        },
        {
          provide: MetricsService, useValue: { incrementPendingApiHit: jest.fn() },
        },
        {
          provide: ProtocolService, useValue: { getSecondsRemainingUntilNextRound: jest.fn() },
        },
        {
          provide: NftExtendedAttributesService, useValue: { getTags: jest.fn() },
        },
        {
          provide: CollectionService, useValue: { applyPropertiesToCollections: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get<EsdtAddressService>(EsdtAddressService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
    collectionService = moduleRef.get<CollectionService>(CollectionService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNftCountForAddressFromElastic', () => {
    it('should return NFT count for a given address from Elastic', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new NftFilter();
      jest.spyOn(indexerService, 'getNftCountForAddress').mockResolvedValue(10);

      const result = await service.getNftCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(10);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledWith(address, filter);
    });

    it('should return all NSFW NFTs count for a given address from Elastic', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new NftFilter();
      filter.isNsfw = true;
      jest.spyOn(indexerService, 'getNftCountForAddress').mockResolvedValue(1);

      const result = await service.getNftCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(1);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledWith(address, filter);
    });

    it('should return all NFT count from a specific collection for a given address from Elastic', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new NftFilter();
      filter.collection = 'XDAY23TEAM-f7a346';
      jest.spyOn(indexerService, 'getNftCountForAddress').mockResolvedValue(20);

      const result = await service.getNftCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(20);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledWith(address, filter);
    });

    it('should return all NFT count from specific collections for a given address from Elastic', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new NftFilter();
      filter.collections = ['XDAY23TEAM-f7a346', 'XDAY23TEAM-f11111'];
      jest.spyOn(indexerService, 'getNftCountForAddress').mockResolvedValue(25);

      const result = await service.getNftCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(25);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getNftCountForAddress).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('getCollectionCountForAddressFromElastic', () => {
    it('should return collections count for a given address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();
      jest.spyOn(indexerService, 'getCollectionCountForAddress').mockResolvedValue(5);

      const result = await service.getCollectionCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(5);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledWith(address, filter);
    });

    it('should return collection count when collection filter is applied for a given address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();
      filter.collection = 'XDAY23TEAM-f7a346';
      jest.spyOn(indexerService, 'getCollectionCountForAddress').mockResolvedValue(1);

      const result = await service.getCollectionCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(1);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledWith(address, filter);
    });

    it('should return collection count when identifiers filter is applied for a given address', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();
      filter.identifiers = ['XDAY23TEAM-f7a346-01', 'XDAY23TEAM-f7a346-02'];
      jest.spyOn(indexerService, 'getCollectionCountForAddress').mockResolvedValue(1);

      const result = await service.getCollectionCountForAddressFromElastic(address, filter);

      expect(result).toStrictEqual(1);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledTimes(1);
      expect(indexerService.getCollectionCountForAddress).toHaveBeenCalledWith(address, filter);
    });
  });

  describe('EsdtAddressService - getCollectionsForAddress', () => {
    const indexerCollectionMock = {
      _id: 'XDAY23TEAM-f7a346',
      name: 'XDAY2023TEAM',
      ticker: 'XDAY23TEAM',
      token: 'XDAY23TEAM-f7a346',
      issuer: 'erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp',
      currentOwner: 'erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp',
      numDecimals: 0,
      type: 'NonFungibleESDT',
      timestamp: 1696923978,
      ownersHistory: [
        {
          address: 'erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp',
          timestamp: 1696923978,
        },
      ],
      properties: {
        canMint: false,
        canBurn: false,
        canUpgrade: true,
        canTransferNFTCreateRole: true,
        canAddSpecialRoles: true,
        canPause: true,
        canFreeze: true,
        canWipe: true,
        canChangeOwner: false,
        canCreateMultiShard: false,
      },
      nft_hasTraitSummary: true,
      roles: {
        ESDTRoleNFTCreate: ['erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp'],
        ESDTTransferRole: ['erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp'],
        ESDTRoleNFTBurn: ['erd178ah2z70a442g9hrt39w2ld67lav62jq72gzp3r9tu5egz4hr4cswr5unp'],
      },
      nft_hasRarities: false,
      api_holderCount: 101,
      api_isVerified: true,
      api_nftCount: 131,
    };

    const propertiesToCollectionsMock: NftCollection = {
      collection: 'XDAY23TEAM-f7a346',
      type: NftType.NonFungibleESDT,
      name: 'xPortalAchievements',
      ticker: 'XDAY23TEAM',
      owner: 'erd1lpc6wjh2hav6q50p8y6a44r2lhtnseqksygakjfgep6c9uduchkqphzu6t',
      timestamp: 0,
      canFreeze: true,
      canWipe: true,
      canPause: true,
      canTransferNftCreateRole: true,
      canChangeOwner: false,
      canUpgrade: false,
      canAddSpecialRoles: false,
      decimals: undefined,
      assets: {
        website: 'https://xday.com',
        description:
          'Test description.',
        status: TokenAssetStatus.active,
        pngUrl: 'https://media.elrond.com/tokens/asset/XDAY23TEAM-f7a346/logo.png',
        name: '',
        svgUrl: 'https://media.elrond.com/tokens/asset/XDAY23TEAM-f7a346/logo.svg',
        extraTokens: [''],
        ledgerSignature: '',
        priceSource: undefined,
        preferredRankAlgorithm: undefined,
        lockedAccounts: undefined,
      },
      scamInfo: undefined,
      traits: [],
      auctionStats: undefined,
      isVerified: undefined,
      holderCount: undefined,
      nftCount: undefined,
    };

    it('should throw BadRequestException when IndexerV3Flag is inactive and specific filters are used', async () => {
      jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(false);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = { canCreate: true };

      await expect(service.getCollectionsForAddress(address, filter, new QueryPagination())).rejects.toThrow(BadRequestException);
    });

    it('should return collections for a given address with IndexerV3Flag active', async () => {
      jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(true);
      jest.spyOn(indexerService, 'getNftCollections').mockResolvedValue([indexerCollectionMock]);
      jest.spyOn(collectionService, 'applyPropertiesToCollections').mockResolvedValue([propertiesToCollectionsMock]);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();
      const pagination = new QueryPagination();

      const results = await service.getCollectionsForAddress(address, filter, pagination);

      expect(results).toHaveLength(1);
      expect(apiConfigService.getIsIndexerV3FlagActive).toHaveBeenCalled();
      expect(apiConfigService.getIsIndexerV3FlagActive).toHaveBeenCalledTimes(2);
      expect(indexerService.getNftCollections).toHaveBeenCalledWith(pagination, filter, address);
      expect(indexerService.getNftCollections).toHaveBeenCalledTimes(1);
      expect(collectionService.applyPropertiesToCollections).toHaveBeenCalled();
    });

    it('should correctly apply roles to collections for a given address with IndexerV3Flag active', async () => {
      jest.spyOn(apiConfigService, 'getIsIndexerV3FlagActive').mockReturnValue(true);
      jest.spyOn(indexerService, 'getNftCollections').mockResolvedValue([indexerCollectionMock]);
      jest.spyOn(collectionService, 'applyPropertiesToCollections').mockResolvedValue([propertiesToCollectionsMock]);

      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();
      const pagination = new QueryPagination();

      const results = await service.getCollectionsForAddress(address, filter, pagination);

      expect(results).toHaveLength(1);
      const firstCollection = results[0];
      expect(firstCollection.canTransfer).toBe(false);
      expect(firstCollection.role.canBurn).toBe(false);
    });
  });
});
