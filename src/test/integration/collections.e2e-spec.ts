import { Test } from "@nestjs/testing";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import {AccountService} from "../../endpoints/accounts/account.service";
import {CollectionAccountFilter} from "../../endpoints/collections/entities/collection.account.filter";

describe('Collection Service', () => {
  let collectionService: CollectionService;
  let accountService: AccountService;
  let collectionIdentifier: string;
  let accountAddress: string;

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);
    accountService = moduleRef.get<AccountService>(AccountService);

    const accounts = await accountService.getAccounts({from: 0, size: 1});
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;

    const collections = await collectionService.getNftCollections({ from: 0, size: 1 }, new CollectionFilter());
    expect(collections).toHaveLength(1);

    const nftCollection = collections[0];
    collectionIdentifier = nftCollection.collection;
  }, Constants.oneHour() * 1000);

  describe('Collections list', () => {
    describe('Collections pagination', () => {
      it(`should return a list with 25 nfts collections`, async () => {
        const collectionsList = await collectionService.getNftCollections({ from: 0, size: 25 }, new CollectionFilter());

        expect(collectionsList).toBeInstanceOf(Array);
        expect(collectionsList).toHaveLength(25);
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
      it(`should return a list with all nfts within a collection`, async () => {
        const collectionFilter = new CollectionFilter();
        collectionFilter.collection = collectionIdentifier;
        const nftsCollections = await collectionService.getNftCollections({ from: 0, size: 25 }, collectionFilter);
        expect(nftsCollections).toBeInstanceOf(Array);

        for (const nftCollection of nftsCollections) {
          expect(nftCollection.collection).toBe(collectionIdentifier);
        }
      });

      it(`should return a list with SemiFungibleESDT collections`, async () => {
        const collectionFilter = new CollectionFilter();
        collectionFilter.type = NftType.SemiFungibleESDT;
        const collectionsList = await collectionService.getNftCollections({ from: 0, size: 25 }, collectionFilter);
        expect(collectionsList).toBeInstanceOf(Array);

        for (const nftCollection of collectionsList) {
          expect(nftCollection.type).toBe(NftType.SemiFungibleESDT);
        }
      });
    });
  });

  describe('Collections count', () => {
    it(`should return a number`, async () => {
      const nftCount: Number = new Number(await collectionService.getNftCollectionCount(new CollectionFilter()));

      expect(nftCount).toBeInstanceOf(Number);
    });
  });

  describe('Get Collection for a specific address', () => {
    it(`should return collectionf for a address`, async () => {
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = '3LR0NDPUNK-f87097-invalid';

      const collectionAddress = await collectionService.getCollectionForAddress(accountAddress,collectionFilter.collection )
      expect(collectionAddress).toBeUndefined();
    });
  });

  describe('Get Collections NonFungibleESDT for a specific address', () => {
    it(`should return collections of NonFungibleESDT for a address`, async () => {
      const collectionsList = await collectionService.getCollectionsForAddress(accountAddress, new CollectionAccountFilter(), {from: 0, size:3});
      expect(collectionsList).toBeInstanceOf(Array);
    });
  });

  describe('Get Collections Count for a specific address', () => {
    it(`should return count collection of NonFungibleESDT for a address`, async () => {
      const collectionAddress = await collectionService.getCollectionCountForAddress(accountAddress, new CollectionAccountFilter());
      expect(collectionAddress).toBe(0);
    });
  });
});

