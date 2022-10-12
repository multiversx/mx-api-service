import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { Test } from "@nestjs/testing";
import { QueryPagination } from 'src/common/entities/query.pagination';
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from 'src/endpoints/collections/entities/collection.filter';
import { PublicAppModule } from "src/public.app.module";
import { IndexerService } from "src/common/indexer/indexer.service";
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import { ElasticService, TokenUtils } from '@elrondnetwork/erdnest';
import { EsdtAddressService } from 'src/endpoints/esdt/esdt.address.service';

describe('Collection Service', () => {
  let collectionService: CollectionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('isCollection', () => {
    it('should return true if collection identifier contain collection format', async () => {
      const collectionIdentifier: string = "EBULB-36c762";

      const result = await collectionService.isCollection(collectionIdentifier);
      expect(result).toStrictEqual(true);
    });

    it('should return false if collection identifier is not in correct format', async () => {
      const collectionIdentifier: string = "EBULB-36c762-e2";

      const result = await collectionService.isCollection(collectionIdentifier);
      expect(result).toStrictEqual(false);
    });
  });

  describe('getNftCollections', () => {
    it('should return a list of 1 collection with details filtered by timestamp', async () => {
      const filter = new CollectionFilter();
      filter.after = 1665508932;
      filter.before = 1665508932;
      const results = await collectionService.getNftCollections(new QueryPagination({ size: 1 }), filter);
      const collection = results.map((result) => result.collection);
      expect(collection.includes("SURACING-8f6ed4")).toBeTruthy();
    });
  });

  describe('getNftCollectionsByIds', () => {
    it('should return collection details based on collection identifiers', async () => {
      const identifiers: string[] = ["EBULB-36c762", "SURACING-8f6ed4"];
      const results = await collectionService.getNftCollectionsByIds(identifiers);
      const collectionIds = results.map((result) => result.collection);

      expect(collectionIds.includes("EBULB-36c762")).toBeTruthy();
      expect(collectionIds.includes("SURACING-8f6ed4")).toBeTruthy();
    });
  });

  describe('getNftCollectionCount', () => {
    it('should return total collections count (default)', async () => {
      jest
        .spyOn(IndexerService.prototype, 'getNftCollectionCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_filter: CollectionFilter) => 5100));

      const results = await collectionService.getNftCollectionCount(new CollectionFilter());
      expect(results).toStrictEqual(5100);
    });
  });

  describe('getNftCollection', () => {
    it('should return collection details', async () => {
      const collectionIdentifier: string = "EBULB-36c762";
      const result = await collectionService.getNftCollection(collectionIdentifier);

      expect(result).toHaveStructure(Object.keys(new NftCollection()));
    });

    it('should return undefined if collection does not exist', async () => {
      jest.spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      const result = await collectionService.getNftCollection("");
      expect(result).toStrictEqual(undefined);
    });

    it('should return undefined if collection does not have the correct format', async () => {
      const mock_isCollection = jest.spyOn(TokenUtils, 'isCollection');
      mock_isCollection.mockImplementation(() => false);

      const result = await collectionService.getNftCollection("EBULB-36c762-02");
      expect(result).toStrictEqual(undefined);
    });
  });

  //ToDo
  // describe('getNftCollectionRoles', () => {
  //   it('should return collections roles', async () => {
  //     jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
  //       // eslint-disable-next-line require-await
  //       .mockImplementation(jest.fn(() => false));

  //     const results = await collectionService.getNftCollectionRoles('SURACING-8f6ed4');
  //   });
  // });

  describe('getCollectionForAddressWithRole', () => {
    it('should return collection address roles', async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
      const collection: string = "EBULB-36c762";
      const result = await collectionService.getCollectionForAddressWithRole(address, collection);

      expect(result).toEqual(expect.objectContaining({
        collection: collection,
        owner: address,
        canCreate: true,
        canBurn: false,
        canAddQuantity: undefined,
        canUpdateAttributes: false,
        canAddUri: false,
        canTransferRole: false,
      }));
    });

    it('should return undefined because test simulate that collection received from method getCollectionsForAddress is empty array', async () => {
      jest.spyOn(EsdtAddressService.prototype, 'getCollectionsForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter, _pagination: QueryPagination) => []));

      const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
      const collection: string = "";
      const result = await collectionService.getCollectionForAddressWithRole(address, collection);

      expect(result).toStrictEqual(undefined);
    });
  });

  describe('getCollectionsWithRolesForAddress', () => {
    it('should return one collection where address has roles', async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
      const result = await collectionService.getCollectionsWithRolesForAddress(address, new CollectionFilter(), new QueryPagination({ size: 1 }));

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          owner: address,
          canCreate: true,
          canBurn: false,
          canAddQuantity: undefined,
          canUpdateAttributes: false,
          canAddUri: false,
          canTransferRole: false,
        }),
      ]));
    });
  });

  describe('getCollectionCountForAddress', () => {
    it('should return total collection count where address has roles', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const result = await collectionService.getCollectionCountForAddress(address, new CollectionFilter());

      expect(result).toStrictEqual(3);
    });
  });

  describe('getCollectionForAddress', () => {
    it('should return address collection details', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const collectionIdentifier: string = "MEDAL-ae074f";

      const result = await collectionService.getCollectionForAddress(address, collectionIdentifier);

      expect(result).toEqual(expect.objectContaining({
        collection: collectionIdentifier,
        owner: address,
      }));
    });

    it('should return undefined because test simulates that given collection identifier does not have the correct format', async () => {
      const mock_isCollection = jest.spyOn(TokenUtils, 'isCollection');
      mock_isCollection.mockImplementation(() => false);

      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const collectionIdentifier: string = "MEDAL-xe074f";

      const result = await collectionService.getCollectionForAddress(address, collectionIdentifier);
      expect(result).toStrictEqual(undefined);
    });
  });

  describe('getCollectionCountForAddressWithRoles', () => {
    it('should return total count of collections where a specific address holds roles', async () => {
      jest.spyOn(EsdtAddressService.prototype, 'getCollectionCountForAddressFromElastic')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter) => 4));

      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const result = await collectionService.getCollectionCountForAddressWithRoles(address, new CollectionFilter());
      expect(result).toStrictEqual(4);
    });
  });
});

