import { Test } from "@nestjs/testing";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { PublicAppModule } from "src/public.app.module";
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';
import { NftCollectionRole } from 'src/endpoints/collections/entities/nft.collection.role';
import { EsdtAddressService } from 'src/endpoints/esdt/esdt.address.service';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ElasticQuery, ElasticService } from '@elrondnetwork/erdnest';
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";

describe('Collection Service', () => {
  let collectionService: CollectionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('getNftCollections', () => {
    it('should return 10 NonFungibleESDTs collections', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, filter);

      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.type).toStrictEqual('NonFungibleESDT');
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it('should return 10 SemiFungibleESDTs collections', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.SemiFungibleESDT];
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, filter);

      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.type).toStrictEqual('SemiFungibleESDT');
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it('should return 10 MetaESDTs collections', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.MetaESDT];
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, filter);

      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.type).toStrictEqual('MetaESDT');
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it('should returns a list of collections of type MetaESDT and SemiFungibleESDTs', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.MetaESDT, NftType.SemiFungibleESDT];
      const results = await collectionService.getNftCollections({ from: 0, size: 50 }, filter);
      const collectionTypes = results.map((result) => result.type);

      expect(collectionTypes.includes(NftType.MetaESDT)).toBeTruthy();
      expect(collectionTypes.includes(NftType.SemiFungibleESDT)).toBeTruthy();
    });
  });

  describe('applyPropertiesToCollections', () => {
    it('should apply proprieties to a specific collection', async () => {
      const results = await collectionService.applyPropertiesToCollections(["EROBOT-527a29", "COLLARV2-467a53"]);

      expect(results.length).toStrictEqual(2);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it('should apply properties to a specific collection of type MetaESDT', async () => {
      const results = await collectionService.applyPropertiesToCollections(["UTKWEGLDF-5b9d50"]);

      for (const result of results) {
        expect(result.type).toStrictEqual('MetaESDT');
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it('should return undefined because test simulates that collection properties are not defined', async () => {
      const onResolver = { undefined };

      jest.spyOn(CollectionService.prototype, 'batchGetCollectionsProperties')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collectionsIdentifiers: string[]) => Promise.resolve(onResolver)));

      const results = await collectionService.applyPropertiesToCollections(['']);

      expect(results).toStrictEqual([]);
    });
  });

  describe('getNftCollectionCount', () => {
    it('should return total number of collections of type NonFungibleESDT', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 4821));

      const result = await collectionService.getNftCollectionCount(filter);

      expect(result).toStrictEqual(4821);
    });

    it('should return total number of collections of type SemiFungibleESDT', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.SemiFungibleESDT];

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 860));

      const result = await collectionService.getNftCollectionCount(filter);

      expect(result).toStrictEqual(860);
    });

    it('should return total number of collections of type MetaESDT', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.MetaESDT];

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 30));

      const result = await collectionService.getNftCollectionCount(filter);

      expect(result).toStrictEqual(30);
    });

    it('should returns total number of collections of type MetaESDT and NonFungibleESDT', async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT, NftType.MetaESDT];

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 4851));

      const result = await collectionService.getNftCollectionCount(filter);

      expect(result).toStrictEqual(4851);
    });
  });

  describe('getNftCollection', () => {
    it('should return collection details', async () => {
      const collection: string = 'EROBOT-527a29';
      const result = await collectionService.getNftCollection(collection);

      expect(result).toHaveStructure(Object.keys(new NftCollection()));
    });

    it('should return undefined if collection is not returned from elastic', async () => {
      jest.spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      const result = await collectionService.getNftCollection('');

      expect(result).toBeUndefined();
    });
  });

  describe('getCollectionForAddressWithRole', () => {
    it('should return collection details with roles for a specific address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed';
      const collection: string = 'EBULB-36c762';
      const results = await collectionService.getCollectionForAddressWithRole(address, collection);

      if (!results) {
        throw new Error('Properties are not defined');
      }

      expect(results.canWipe).toStrictEqual(false);
      expect(results.canBurn).toStrictEqual(false);
      expect(results.canPause).toStrictEqual(false);
      expect(results.canCreate).toStrictEqual(true);
      expect(results.canFreeze).toStrictEqual(false);
      expect(results.canAddUri).toStrictEqual(false);
      expect(results.canTransferRole).toStrictEqual(false);
      expect(results.canUpdateAttributes).toStrictEqual(false);
      expect(results.canTransferNftCreateRole).toStrictEqual(false);
    });

    it('should return undefined because test simulate that address does not contains any collection', async () => {
      jest.spyOn(EsdtAddressService.prototype, 'getCollectionsForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter, _pagination: QueryPagination) => []));

      const address: string = 'erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed';
      const results = await collectionService.getCollectionForAddressWithRole(address, '');

      expect(results).toBeUndefined();
    });
  });

  describe('getCollectionsWithRolesForAddress', () => {
    it('should returns all collections with roles for a specific address', async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => false));

      const address: string = 'erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed';
      const filter = new CollectionFilter();
      filter.collection = 'EBULB-36c762';
      const results = await collectionService.getCollectionsWithRolesForAddress(address, filter, { from: 0, size: 1 });

      expect(results.length).toStrictEqual(1);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollectionRole()));
      }
    });
  });

  describe('getCollectionCountForAddress', () => {
    it('should return collection count for a specific address', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];
      const results = await collectionService.getCollectionCountForAddress(address, filter);

      expect(typeof results).toStrictEqual('number');
    });
  });

  describe('getCollectionForAddress', () => {
    it('should return collection details for a specific address', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const collection: string = 'MEDAL-ae074f';
      const results = await collectionService.getCollectionForAddress(address, collection);

      expect(results).toHaveStructure(Object.keys(new NftCollectionAccount()));
    });

    it('should return undefined because test simulates that address does not contains any collections', async () => {
      jest.spyOn(CollectionService.prototype, 'getCollectionsForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter, _pagination: QueryPagination) => []));

      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const results = await collectionService.getCollectionForAddress(address, '');

      expect(results).toBeUndefined();
    });
  });

  describe('getCollectionsForAddress', () => {
    it('should return all collections details of type NonFungibleESDT for a specific address', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];
      const results = await collectionService.getCollectionsForAddress(address, filter, { from: 0, size: 2 });

      expect(results.length).toStrictEqual(2);

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result).toHaveStructure(Object.keys(new NftCollectionAccount()));
      }
    });
    it('should return a specific collection details if search filter is applied', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.search = 'MEDAL-ae074f';
      const results = await collectionService.getCollectionsForAddress(address, filter, { from: 0, size: 1 });

      for (const result of results) {
        expect(result.collection).toStrictEqual('MEDAL-ae074f');
        expect(result).toHaveStructure(Object.keys(new NftCollectionAccount()));
      }
    });
    it('should return an empty array if search filter is applied with wrong collection identifier details', async () => {
      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.search = 'MEDAL-ae074fTest';
      const results = await collectionService.getCollectionsForAddress(address, filter, { from: 0, size: 1 });

      for (const result of results) {
        expect(result).toStrictEqual([]);
      }
    });
  });

  describe('getCollectionCountForAddressWithRoles', () => {
    it('should return collections count for address with roles with collection type NonFungibleESDT', async () => {
      jest.spyOn(EsdtAddressService.prototype, 'getCollectionCountForAddressFromElastic')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter) => 4));

      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];
      const results = await collectionService.getCollectionCountForAddressWithRoles(address, filter);

      expect(results).toStrictEqual(4);
    });

    it('should return collections count for address with roles of canCreate', async () => {
      jest.spyOn(EsdtAddressService.prototype, 'getCollectionCountForAddressFromElastic')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: CollectionFilter) => 1));

      const address: string = 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj';
      const filter = new CollectionFilter();
      filter.canCreate = true;
      const results = await collectionService.getCollectionCountForAddressWithRoles(address, filter);

      expect(results).toStrictEqual(1);
    });
  });

  describe('getNftCollectionRoles', () => {
    it('should return collections roles', async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      const results = await collectionService.getNftCollectionRoles('canUpdateAttributes');
      expect(results).toStrictEqual([]);
    });
  });

  describe('isCollection', () => {
    const collection =
    {
      _id: 'MEDAL-ae074f',
      name: 'GLUMedals',
      ticker: 'MEDAL',
      token: 'MEDAL-ae074f',
      issuer: 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj',
      currentOwner: 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj',
      type: 'NonFungibleESDT',
      timestamp: 1654019676,
      ownersHistory: [
        {
          address: 'erd126y66ear20cdskrdky0kpzr9agjul7pcut7ktlr6p0eu8syxhvrq0gsqdj',
          timestamp: 1654019676,
        },
      ],
      roles: {
        ESDTRoleNFTCreate: [
          'erd1qqqqqqqqqqqqqpgq8ne37ed06034qxfhm09f03ykjfqwx8s7hvrqackmzt',
        ],
      },
    };

    it('should verify if given collection identifier is collection and return true', async () => {
      const getCollectionSpy = jest
        .spyOn(ElasticIndexerService.prototype, 'getCollection')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => collection));

      const result = await collectionService.isCollection(collection._id);

      expect(getCollectionSpy).toHaveBeenCalled();
      expect(result).toStrictEqual(true);
    });
  });

  describe('getNftCollectionsByIds', () => {
    it('should return two NFT Collections details for a given list of two collections identifiers', async () => {
      const results = await collectionService.getNftCollectionsByIds(['MEDAL-ae074f', 'EBULB-36c762']);
      const collectionResults = results.map((result) => result.collection);

      expect(collectionResults.includes('EBULB-36c762')).toBeTruthy();
      expect(collectionResults.includes('MEDAL-ae074f')).toBeTruthy();
    });
  });
});

