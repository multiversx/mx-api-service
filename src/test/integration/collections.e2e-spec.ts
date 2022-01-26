import { Test } from "@nestjs/testing";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import { CollectionAccountFilter } from "../../endpoints/collections/entities/collection.account.filter";

describe('Collection Service', () => {
  let collectionService: CollectionService;
  let collectionIdentifier: string;

  const NftCollection: string = 'DEITIES-0d1f10';
  const collectionAddress: string = 'erd1gv55fk7gn0f437eq53x7u5zux824a9ff86v5pvnneg7yvsucpp0svncsmz';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);

    const collections = await collectionService.getNftCollections({ from: 0, size: 1 }, new CollectionFilter());
    expect(collections).toHaveLength(1);

    const nftCollection = collections[0];
    collectionIdentifier = nftCollection.collection;
  }, Constants.oneHour() * 1000);

  describe('Collections list', () => {
    describe('Collections pagination', () => {
      it(`should return a list with 25 nfts collections`, async () => {
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, new CollectionFilter());
        expect(collections).toHaveLength(25);

        for (const collection of collections) {
          expect(collection).toHaveProperty('assets');
          expect(collection).toHaveProperty('canFreeze');
          expect(collection).toHaveProperty('canPause');
          expect(collection).toHaveProperty('canTransferRole');
          expect(collection).toHaveProperty('canWipe');
        }
      });

      it(`should return a list with 10 nfts collections`, async () => {
        const collectionsList = await collectionService.getNftCollections({ from: 0, size: 10 }, new CollectionFilter());
        expect(collectionsList).toBeInstanceOf(Array);
        expect(collectionsList).toHaveLength(10);

        for (const nftCollection of collectionsList) {
          expect(nftCollection.owner).toBeDefined();
          expect(nftCollection.collection).toBeDefined();
        }
      });
    });

    describe('Collections filters', () => {
      it(`should return single collection`, async () => {
        const collectionFilter = new CollectionFilter();
        collectionFilter.collection = collectionIdentifier;
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, collectionFilter);
        expect(collections).toBeInstanceOf(Array);

        for (const nftCollection of collections) {
          expect(nftCollection.collection).toBe(collectionIdentifier);
        }
      });

      it(`should return a list with SemiFungibleESDT collections`, async () => {
        const collectionFilter = new CollectionFilter();
        collectionFilter.type = NftType.SemiFungibleESDT;
        const collections = await collectionService.getNftCollections({ from: 0, size: 25 }, collectionFilter);
        expect(collections).toBeInstanceOf(Array);

        for (const nftCollection of collections) {
          expect(nftCollection.type).toBe(NftType.SemiFungibleESDT);
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
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = NftCollection;

      const collection = await collectionService.getCollectionForAddress(collectionAddress, collectionFilter.collection);
      expect(collection).toBeInstanceOf(Object);
    });
  });

  describe('Get Collection of NonFungibleESDT for a specific address', () => {
    it(`should return collection of NonFungibleESDT for a specific address`, async () => {
      const collection = await collectionService.getCollectionsForAddress(collectionAddress, new CollectionAccountFilter(), {
        from: 0,
        size: 3,
      });
      expect(collection).toBeInstanceOf(Object);
    });
  });

  describe('Get Collections Count for a specific address', () => {
    it(`should return count collection of NonFungibleESDT for a specific address`, async () => {
      const count = await collectionService.getCollectionCountForAddress(collectionAddress, new CollectionAccountFilter());
      expect(typeof count).toBe('number');
    });
  });

  describe('Get NFT Collection', () => {
    it(`should return nft collection`, async () => {
     const collection = await collectionService.getNftCollection(NftCollection);
     expect(collection).toBeInstanceOf(Object);
     expect(collection?.owner).toBeDefined();
    });
  });
});

