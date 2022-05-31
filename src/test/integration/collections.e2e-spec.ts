import { NftType } from '../../endpoints/nfts/entities/nft.type';
import { CollectionFilter } from '../../endpoints/collections/entities/collection.filter';
import { Test } from "@nestjs/testing";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { PublicAppModule } from "src/public.app.module";
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import '../../utils/extensions/jest.extensions';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';

describe('Collection Service', () => {
  let collectionService: CollectionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    collectionService = moduleRef.get<CollectionService>(CollectionService);
  });

  describe("NFT Collections", () => {
    it("shoult return 10 NonFungibleESDT collections", async () => {
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, filter);

      expect(results).toHaveLength(10);

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it(`should return a list with SemiFungibleESDT collections`, async () => {
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, { type: [NftType.SemiFungibleESDT] });

      expect(results).toHaveLength(10);

      for (const result of results) {
        expect(result.type).toBe(NftType.SemiFungibleESDT);
      }
    });

    it("shoult return a list of collections with creator filter", async () => {
      const filter = new CollectionFilter();
      filter.canCreate = "erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr";
      const results = await collectionService.getNftCollections({ from: 0, size: 10 }, filter);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it("should return one collection based on collection identifiers", async () => {
      const filters = new CollectionFilter();
      filters.identifiers = ["EROBOT-527a29", "COLLARV2-467a53"];

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      const collections = results.map((result) => result.name);
      expect(collections.includes("PittzTestCollection")).toBeTruthy();
      expect(collections.includes("eRobots")).toBeTruthy();
      expect(results).toHaveLength(2);
    });

    it("should return one collection based on identifier and roles properties are not defined", async () => {

      const filters = new CollectionFilter();
      filters.identifiers = ["EROBOT-527a29"];

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      for (const result of results) {
        expect(result.roles).toStrictEqual([]);
        expect(results).toHaveLength(1);
      }
    });

    it("should return owner collections", async () => {
      const filters = new CollectionFilter();
      filters.owner = "erd1nz42knvgmxpevepsyvq9dx3wzdgtd6lmu96y28tuupayazgx4fvs3w9d09";

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it(`should return collection with "canBurn" property`, async () => {
      const filters = new CollectionFilter();
      filters.canBurn = true;

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it(`should return collection with "canCreate" property`, async () => {
      const filters = new CollectionFilter();
      filters.canCreate = true;

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it(`should return collection with "canAddQuantity" property`, async () => {
      const filters = new CollectionFilter();
      filters.canAddQuantity = true;

      const results = await collectionService.getNftCollections({ from: 0, size: 2 }, filters);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new NftCollection()));
      }
    });

    it("should return nft collection", async () => {
      const collection: string = "EROBOT-527a29";
      const result = await collectionService.getNftCollection(collection);

      expect(result).toHaveStructure(Object.keys(new NftCollection()));
    });

    it("should return nft collection and if collection has roles, roles property must be defined", async () => {
      const collection: string = "EROBOT-527a29";
      const result = await collectionService.getNftCollection(collection);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.roles).toBeDefined();
      expect(result).toHaveStructure(Object.keys(new NftCollection()));
    });
  });

  describe("Collection Count", () => {
    it("should return collection count of a specific address ( owner )", async () => {
      const filters = new CollectionFilter();
      filters.owner = "erd1nz42knvgmxpevepsyvq9dx3wzdgtd6lmu96y28tuupayazgx4fvs3w9d09";

      const results = await collectionService.getNftCollectionCount(filters);
      expect(typeof results).toBe("number");
    });

    it("should return collection count for collection of type NonFungibleESDT", async () => {
      const filters = new CollectionFilter();
      filters.type = [NftType.NonFungibleESDT];

      const results = await collectionService.getNftCollectionCount(filters);
      expect(typeof results).toBe("number");
    });

    it("should return collection count for collection of type SemiFungibleESDT", async () => {
      const filters = new CollectionFilter();
      filters.type = [NftType.SemiFungibleESDT];

      const results = await collectionService.getNftCollectionCount(filters);
      expect(typeof results).toBe("number");
    });

    it("should return collection count for two collections identifiers", async () => {
      const filters = new CollectionFilter();
      filters.identifiers = ["EROBOT-527a29", "COLLARV2-467a53"];

      const results = await collectionService.getNftCollectionCount(filters);

      expect(results).toStrictEqual(2);
      expect(typeof results).toBe("number");
    });

    it("should return collection count for collection who contain can canBurn property", async () => {
      const filters = new CollectionFilter();
      filters.canBurn = true;

      const results = await collectionService.getNftCollectionCount(filters);

      expect(typeof results).toBe("number");
    });

    it("should return collection count for collection who contain can canCreate property", async () => {
      const filters = new CollectionFilter();
      filters.canCreate = true;

      const results = await collectionService.getNftCollectionCount(filters);

      expect(typeof results).toBe("number");
    });

    it("should return collection count for collection who contain can canAddQuantity property", async () => {
      const filters = new CollectionFilter();
      filters.canAddQuantity = true;

      const results = await collectionService.getNftCollectionCount(filters);

      expect(typeof results).toBe("number");
    });
  });

  describe("Collection Count For Address", () => {
    it("should return collection count for a specific address", async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr";
      const filter = new CollectionFilter();
      filter.collection = "EROBOT-527a29";

      const results = await collectionService.getCollectionCountForAddress(address, filter);

      expect(typeof results).toBe("number");
    });
  });

  describe("Collections For Address", () => {
    it("should return collection of NonFungibleESDT for address", async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
      const filter = new CollectionFilter();
      filter.type = [NftType.NonFungibleESDT];

      const results = await collectionService.getCollectionsForAddress(address, filter, { from: 0, size: 10 });

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result.hasOwnProperty("collection")).toBeTruthy();
        expect(result.hasOwnProperty("name")).toBeTruthy();
      }
    });

    it("should return collection for address based on identifiers", async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgq09vq93grfqy7x5fhgmh44ncqfp3xaw57ys5s7j9fed";
      const filter = new CollectionFilter();
      filter.identifiers = ["EBULB-36c762"];

      const results = await collectionService.getCollectionsForAddress(address, filter, { from: 0, size: 10 });

      for (const result of results) {
        expect(result.hasOwnProperty("collection")).toBeTruthy();
        expect(result.hasOwnProperty("name")).toBeTruthy();
      }
    });
  });

  describe("Collection For Address", () => {
    it("should return collection of NonFungibleESDT for address", async () => {
      const address: string = "erd159r7g930sauzahvslnve4rpp5xfhwku2rxzp5awycrpfsys8r7zsp4jy65";
      const collection: string = "EBULB-36c762";

      const results = await collectionService.getCollectionForAddress(address, collection);

      if (!results) {
        throw new Error("Properties are not defined");
      }
      expect(results).toHaveStructure(Object.keys(new NftCollectionAccount()));
    });

    it(`should return collection for a specific address`, async () => {
      const address: string = "erd1gv55fk7gn0f437eq53x7u5zux824a9ff86v5pvnneg7yvsucpp0svncsmz";
      const collectionIdentifier: string = 'AEROCIA-487b5f';
      const collection = await collectionService.getCollectionForAddress(address, collectionIdentifier);

      expect(collection).toHaveStructure(Object.keys(new NftCollectionAccount()));
    });
  });
});

