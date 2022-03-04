import { NftQueryOptions } from '../../endpoints/nfts/entities/nft.query.options';
import { Test } from "@nestjs/testing";
import { NftService } from "src/endpoints/nfts/nft.service";
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/array.extensions';
import { PublicAppModule } from "src/public.app.module";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftOwner } from 'src/endpoints/nfts/entities/nft.owner';

describe('Nft Service', () => {
  let nftService: NftService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);

  });

  describe("NFT List", () => {
    it(`should return a list with 25 nfts and verify if nft contains property`, async () => {
      const nfts = await nftService.getNfts({ from: 0, size: 25 }, new NftFilter());

      expect(nfts.length).toBe(25);

      for (const nft of nfts) {
        expect(nft.hasOwnProperty("identifier")).toBeTruthy();
        expect(nft.hasOwnProperty("collection")).toBeTruthy();
        expect(nft.hasOwnProperty("timestamp")).toBeTruthy();
      }
    });

    it(`should return a list with 50 nfts and verify if nft contains property`, async () => {
      const nfts = await nftService.getNfts({ from: 0, size: 50 }, new NftFilter());

      expect(nfts.length).toBe(50);

      for (const nft of nfts) {
        expect(nft.hasOwnProperty("identifier")).toBeTruthy();
        expect(nft.hasOwnProperty("collection")).toBeTruthy();
        expect(nft.hasOwnProperty("timestamp")).toBeTruthy();
      }
    });

    it("should verify if the first element in the pagination filter (from: 0) is different from (from: 1) ", async () => {
      const nft_0 = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
      const nft_1 = await nftService.getNfts({ from: 1, size: 2 }, new NftFilter());

      expect(nft_0).not.toStrictEqual(nft_1);
    });
  });

  describe("NFT Filters", () => {
    it("should return a list with NonFungibleESDTs from a specific collection", async () => {
      const filters = new NftFilter();
      filters.collection = 'EROBOT-527a29';
      filters.type = NftType.NonFungibleESDT;

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filters);

      for (const nft of nfts) {
        expect(nft.collection).toStrictEqual("EROBOT-527a29");
        expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
      }
    });

    it("should return a list of NonFungibleESDT with specific identifiers", async () => {
      const filters = new NftFilter();
      filters.identifiers = ['EROBOT-527a29-c4', 'EROBOT-527a29-c3'];

      const nfts = await nftService.getNfts({ from: 0, size: 100 }, filters);
      const nftsIdentifiers = nfts.map((nft) => nft.identifier);

      expect(nftsIdentifiers.includes("EROBOT-527a29-c4")).toBeTruthy();
      expect(nftsIdentifiers.includes("EROBOT-527a29-c3")).toBeTruthy();
      expect(nftsIdentifiers).toHaveLength(2);
    });

    it("should return a list with all nfts of the creator", async () => {
      const filters = new NftFilter();
      filters.creator = "erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr";
      filters.type = NftType.NonFungibleESDT;

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filters);

      for (const nft of nfts) {
        expect(nft.collection).toStrictEqual("EROBOT-527a29");
        expect(nft.creator).toStrictEqual("erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr");
        expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
      }
    });

    it("should return a list with all nfts that contains tags", async () => {
      const filters = new NftFilter();
      filters.tags = [
        "Elrond",
        "MAW",
        "superMAW",
        "Romania",
        "TrustStaking"];

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filters);
      expect(nfts).toHaveLength(10);

      for (const nft of nfts) {
        expect(nft.tags).toBeDefined();
      }
    });

    it("should return a list with all nft that has option withOwner on true", async () => {
      const filters = new NftFilter();
      filters.identifiers = ['EROBOT-527a29-c4'];

      const options = new NftQueryOptions();
      options.withOwner = true;

      const results = await nftService.getNfts({ from: 0, size: 10 }, filters, options);

      const nftsIdentifiers = results.map((result) => result.identifier);

      expect(nftsIdentifiers.includes("EROBOT-527a29-c4")).toBeTruthy();
    });

    it(`should verify if returned values of /nfts?identifiers=EROBOT-527a29-c4&withOwner=true has the same values as nfts/EROBOT-527a29-c4`, async () => {
      const identifier: string = "EROBOT-527a29-c4";
      const filter = new NftFilter();
      filter.identifiers = [identifier];

      const results = await nftService.getNfts({ from: 0, size: 1 }, filter);
      const result = await nftService.getSingleNft(identifier);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      for (const nftResult of results) {
        expect(nftResult.identifier).toStrictEqual(result.identifier);
        expect(nftResult.collection).toStrictEqual(result.collection);
        expect(nftResult.attributes).toStrictEqual(result.attributes);
        expect(nftResult.nonce).toStrictEqual(result.nonce);
        expect(nftResult.type).toStrictEqual(result.type);
        expect(nftResult.creator).toStrictEqual(result.creator);
        expect(nftResult.royalties).toStrictEqual(result.royalties);
        expect(nftResult.isWhitelistedStorage).toStrictEqual(result.isWhitelistedStorage);
        expect(nftResult.tags).toStrictEqual(result.tags);
      }
    });

    it(`should return a list with SemiFungibleESDT tokens`, async () => {
      const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.SemiFungibleESDT });

      expect(nfts.length).toStrictEqual(25);

      for (const nft of nfts) {
        expect(nft.type).toStrictEqual(NftType.SemiFungibleESDT);
      }
    });

    it(`should return a list with NonFungibleESDT tokens`, async () => {
      const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.NonFungibleESDT });

      expect(nfts.length).toStrictEqual(25);

      for (const nft of nfts) {
        expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
      }
    });

    it(`should return a list with MetaESDT tokens`, async () => {
      const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.MetaESDT });

      expect(nfts.length).toStrictEqual(25);

      for (const nft of nfts) {
        expect(nft.type).toStrictEqual(NftType.MetaESDT);
      }
    });
  });

  describe("NFT Count", () => {
    it("should return the number of nfts from a collection", async () => {
      const filters = new NftFilter();
      filters.collection = 'EROBOT-527a29';

      const count = await nftService.getNftCount(filters);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(100);
    });

    it("should return the number of nfts from a specific list of identifiers", async () => {
      const filters = new NftFilter();
      filters.identifiers = ['EROBOT-527a29-c4', 'EROBOT-527a29-c3'];

      const count = await nftService.getNftCount(filters);

      expect(typeof count).toBe("number");
      expect(count).toStrictEqual(2);
    });

    it("should return the number of nfts from a specific creator", async () => {
      const filters = new NftFilter();
      filters.creator = "erd1qqqqqqqqqqqqqpgqlxyw866pd8pvfqvphgsz9dgx5mr44uv5ys5sew4epr";

      const count = await nftService.getNftCount(filters);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(100);
    });

    it("should return the number of nfts with name specified", async () => {
      const filters = new NftFilter();
      filters.name = "Elrond Robots #196";

      const count = await nftService.getNftCount(filters);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(10000);
    });

    it(`should return esdt count for address with type MetaESDT`, async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgqr8z5hkwek0pmytcvla86qjusn4hkufjlrp8s7hhkjk";
      const count = await nftService.getNftCountForAddress(address, { type: NftType.MetaESDT });

      expect(count > 0).toBeTruthy();
    });

    it(`should return esdt count for address with type SemiFungibleESDT`, async () => {
      const address: string = "erd1dgctxljv7f6x8ngsqden99snygjw37dle3t8ratn59r33slsy4rqc3dpsh";
      const count = await nftService.getNftCountForAddress(address, { type: NftType.SemiFungibleESDT });

      expect(count).toBeGreaterThanOrEqual(0);
    });

    it(`should return esdt count for address with type NonFungibleESDT`, async () => {
      const address: string = "erd1k3wtee6vzk47halxwm7qud3mrdjrlw4fyjvuhamtzy4hjhe6htcsv9jcgs";
      const count = await nftService.getNftCountForAddress(address, { type: NftType.NonFungibleESDT });

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("NFTS Address", () => {
    it("should return a list of NonFungible tokens for a specific address", async () => {
      const address: string = "erd1fs7dp439gw2at58a2pqn3hdnxqh5vskq5uzjdf9kajkxy3p0vy7qeh7k00";

      const results = await nftService.getNftsForAddress(address, { from: 0, size: 100 }, { type: NftType.NonFungibleESDT });

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);

        expect(result.hasOwnProperty("identifier")).toBeTruthy();
        expect(result.hasOwnProperty("collection")).toBeTruthy();
        expect(result.hasOwnProperty("timestamp")).toBeTruthy();
        expect(result.hasOwnProperty("attributes")).toBeTruthy();
        expect(result.hasOwnProperty("nonce")).toBeTruthy();
        expect(result.hasOwnProperty("name")).toBeTruthy();
        expect(result.hasOwnProperty("creator")).toBeTruthy();
        expect(result.hasOwnProperty("royalties")).toBeTruthy();
      }
    });

    it("should return a list of NonFungible tokens for a specific address and applied filter withSupply = true", async () => {
      const address: string = "erd1fs7dp439gw2at58a2pqn3hdnxqh5vskq5uzjdf9kajkxy3p0vy7qeh7k00";
      const options = new NftQueryOptions();
      options.withSupply = true;

      const results = await nftService.getNftsForAddress(address, { from: 0, size: 100 }, { type: NftType.NonFungibleESDT }, options);

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result.supply).toBeDefined();
      }
    });

    it("returned list should not have owner property defined", async () => {
      const address: string = "erd1fs7dp439gw2at58a2pqn3hdnxqh5vskq5uzjdf9kajkxy3p0vy7qeh7k00";
      const options = new NftQueryOptions();
      options.withSupply = true;

      const results = await nftService.getNftsForAddress(address, { from: 0, size: 100 }, { type: NftType.NonFungibleESDT }, options);

      for (const result of results) {
        expect(result.owner).not.toBeDefined();
      }
    });
  });

  describe("NFT Address", () => {
    it("should return a list of nfts for a specific address", async () => {
      const address: string = "erd1fs7dp439gw2at58a2pqn3hdnxqh5vskq5uzjdf9kajkxy3p0vy7qeh7k00";
      const identifier: string = "EROBOT-527a29-c4";

      const results = await nftService.getNftForAddress(address, identifier);

      if (!results) {
        throw new Error("Properties are not defined");
      }

      expect(results.hasOwnProperty("identifier")).toBeTruthy();
      expect(results.hasOwnProperty("collection")).toBeTruthy();
      expect(results.hasOwnProperty("timestamp")).toBeTruthy();
      expect(results.hasOwnProperty("attributes")).toBeTruthy();
      expect(results.hasOwnProperty("nonce")).toBeTruthy();
      expect(results.hasOwnProperty("name")).toBeTruthy();
      expect(results.hasOwnProperty("creator")).toBeTruthy();
      expect(results.hasOwnProperty("royalties")).toBeTruthy();
    });
  });

  describe("NFT Owners", () => {
    it('should return nft owner', async () => {
      const identifier: string = "EROBOT-527a29-c4";
      const owners = await nftService.getNftOwners(identifier, { from: 0, size: 1 });

      if (!owners) {
        throw new Error('Nft properties are not defined');
      }

      expect(owners).toHaveLength(1);

      for (const owner of owners) {
        expect(owner).toHaveStructure(Object.keys(new NftOwner()));
        expect(owner.balance).toStrictEqual("1");
      }
    });
  });

  describe("Single NFT", () => {
    it("should return one nft from collection", async () => {
      const identifier: string = "EROBOT-527a29-c4";
      const result = await nftService.getSingleNft(identifier);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
      expect(result.identifier).toStrictEqual("EROBOT-527a29-c4");
      expect(result.creator).toBeDefined();
    });
  });
});
