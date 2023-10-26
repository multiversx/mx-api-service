import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { AssetsService } from "src/common/assets/assets.service";
import { IndexerService } from "src/common/indexer/indexer.service";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { PluginService } from "src/common/plugins/plugin.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtService } from "src/endpoints/esdt/esdt.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";

describe('CollectionService', () => {
  let service: CollectionService;
  let indexerService: IndexerService;
  let esdtAddressService: EsdtAddressService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CollectionService,
        {
          provide: IndexerService, useValue: {
            getCollection: jest.fn(),
            getNftCollections: jest.fn(),
            getNftCollectionsByIds: jest.fn(),
            getNftCollectionCount: jest.fn(),
            getCollectionsForAddress: jest.fn(),
          },
        },
        {
          provide: EsdtService, useValue: {
            getCollectionProperties: jest.fn(),
            getEsdtTokenProperties: jest.fn(),
          },
        },
        {
          provide: EsdtAddressService, useValue: {
            getCollectionsForAddress: jest.fn(),
            getCollectionCountForAddressFromElastic: jest.fn(),
          },
        },
        {
          provide: VmQueryService, useValue: {
            vmQuery: jest.fn(),
          },
        },
        {
          provide: CacheService, useValue: {
            batchApplyAll: jest.fn(),
          },
        },
        {
          provide: CacheService, useValue: {
            get: jest.fn(),
            getOrSet: jest.fn(),
            batchGetAll: jest.fn(),
          },
        },
        {
          provide: PersistenceService, useValue: { getCollectionTraits: jest.fn() },
        },
        {
          provide: ApiConfigService, useValue:
          {
            getCollectionPropertiesFromGateway: jest.fn(),
            getIsIndexerV3FlagActive: jest.fn(),
            getEsdtContractAddress: jest.fn(),
          },
        },
        {
          provide: AssetsService, useValue:
          {
            getTokenAssets: jest.fn(),
            getCollectionRanks: jest.fn(),
          },
        },
        {
          provide: PluginService, useValue:
          {
            processCollections: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<CollectionService>(CollectionService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    esdtAddressService = moduleRef.get<EsdtAddressService>(EsdtAddressService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNftCollectionCount', () => {
    it('should return NFT collection count', async () => {
      const filter = new CollectionFilter();
      jest.spyOn(indexerService, 'getNftCollectionCount').mockResolvedValue(100);

      const result = await service.getNftCollectionCount(filter);

      expect(result).toStrictEqual(100);
      expect(indexerService.getNftCollectionCount).toHaveBeenCalledWith(filter);
      expect(indexerService.getNftCollectionCount).toHaveBeenCalledTimes(1);
    });

    it('should return NFT collection count for a given owner', async () => {
      const filter = new CollectionFilter();
      filter.owner = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      jest.spyOn(indexerService, 'getNftCollectionCount').mockResolvedValue(5);

      const result = await service.getNftCollectionCount(filter);

      expect(result).toStrictEqual(5);
      expect(indexerService.getNftCollectionCount).toHaveBeenCalledWith(filter);
      expect(indexerService.getNftCollectionCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCollectionCountForAddressWithRoles', () => {
    it('should return collection count for address with roles', async () => {
      const address = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const filter = new CollectionFilter();

      jest.spyOn(esdtAddressService, 'getCollectionCountForAddressFromElastic').mockResolvedValue(100);

      const result = await service.getCollectionCountForAddressWithRoles(address, filter);

      expect(result).toStrictEqual(100);
      expect(esdtAddressService.getCollectionCountForAddressFromElastic).toHaveBeenCalledWith(address, filter);
      expect(esdtAddressService.getCollectionCountForAddressFromElastic).toHaveBeenCalledTimes(1);
    });
  });
});
