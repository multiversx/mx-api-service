import { Test } from "@nestjs/testing";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import { NftCollection } from "../../endpoints/collections/entities/nft.collection";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";

describe('Collection Service', () => {
  let collectionService: CollectionService;

  const collectionIdentifier: string = 'DEITIES-0d1f10';
  const collectionAddress: string = 'erd1gv55fk7gn0f437eq53x7u5zux824a9ff86v5pvnneg7yvsucpp0svncsmz';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);

    const collections = await collectionService.getNftCollections({ from: 0, size: 1 }, new CollectionFilter());
    expect(collections).toHaveLength(1);
  }, Constants.oneHour() * 1000);

  describe('Collections list', () => {
    describe('Collections pagination', () => {
      it(`should return a list with 25 nfts collections`, async () => {
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, new CollectionFilter());
        expect(collections).toHaveLength(25);

        for (const collection of collections) {
          expect(collection).toHaveStructure(Object.keys(new NftCollection()));
        }
      });

      it(`should return a list with 10 nfts collections`, async () => {
        const collections = await collectionService.getNftCollections({ from: 0, size: 10 }, new CollectionFilter());
        expect(collections).toBeInstanceOf(Array);
        expect(collections).toHaveLength(10);

        for (const collection of collections) {
          expect(collection.owner).toBeDefined();
          expect(collection.collection).toBeDefined();
          expect(collection).toHaveStructure(Object.keys(new NftCollection()));
        }
      });
    });

    describe('Collections filters', () => {
      it(`should return single collection`, async () => {
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, { collection: collectionIdentifier });
        expect(collections).toBeInstanceOf(Array);

        for (const collection of collections) {
          expect(collection.collection).toBe(collectionIdentifier);
        }
      });

      it(`should return a list with SemiFungibleESDT collections`, async () => {
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, { type: NftType.SemiFungibleESDT });
        expect(collections).toBeInstanceOf(Array);

        for (const collection of collections) {
          expect(collection.type).toBe(NftType.SemiFungibleESDT);
        }
      });

      it('should return collection based identifiers', async () => {
        const filter = new CollectionFilter();
        filter.identifiers = ["MAW-894a92-0447", "MAW-894a92-0446"];
        const collections = await collectionService.getNftCollections({ from: 0, size: 1 }, filter);

        for (const collection of collections) {
          console.log(collection.name);
          expect(collection.name).toStrictEqual("MAW-894a92");
        }
      });
    });
  });

  describe('Collections count', () => {
    it(`should return a number`, async () => {
      const count = await collectionService.getNftCollectionCount(new CollectionFilter());
      expect(typeof count).toBe('number');
    });
  });

  describe('Get Collection for a specific address', () => {
    it(`should return collection for a specific address`, async () => {
      const collection = await collectionService.getCollectionForAddress(collectionAddress, collectionIdentifier);
      const collectionToTest = new NftCollectionAccount();
      // @ts-ignore
      delete collectionToTest.timestamp;
      //@ts-ignore
      delete collectionToTest.owner;

      expect(collection).toBeDefined();
      expect(collection).toHaveStructure(Object.keys(collectionToTest));
    });
  });

  describe('Get Collection of NonFungibleESDT for a specific address', () => {
    it(`should return collection of NonFungibleESDT for a specific address`, async () => {
      const collections = await collectionService.getCollectionsForAddress(collectionAddress, new CollectionFilter(), {
        from: 0,
        size: 3,
      });

      expect(collections).toBeInstanceOf(Array);
      expect(collections.length).toStrictEqual(3);

      for (const collection of collections) {
        const collectionToTest = new NftCollectionAccount();

        // @ts-ignore
        delete collectionToTest.timestamp;

        //@ts-ignore
        delete collectionToTest.owner;

        expect(collection).toHaveStructure(Object.keys(collectionToTest));
      }
    });
  });

  describe('Get Collections Count for a specific address', () => {
    it(`should return count collection of NonFungibleESDT for a specific address`, async () => {
      const count = await collectionService.getCollectionCountForAddress(collectionAddress, new CollectionFilter());
      expect(typeof count).toBe('number');
    });
  });

  describe('Get NFT Collection', () => {
    it(`should return nft collection`, async () => {
      const collection = await collectionService.getNftCollection(collectionIdentifier);
      if (!collection) {
        throw new Error('Collection is not defined');
      }

      expect(collection).toHaveStructure(Object.keys(new NftCollection()));
      expect(collection.owner).toBeDefined();
    });
  });
});

