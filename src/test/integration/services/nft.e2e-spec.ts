import { NftQueryOptions } from 'src/endpoints/nfts/entities/nft.query.options';
import { Test } from "@nestjs/testing";
import { NftService } from "src/endpoints/nfts/nft.service";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import { PublicAppModule } from "src/public.app.module";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftOwner } from 'src/endpoints/nfts/entities/nft.owner';
import { EsdtAddressService } from 'src/endpoints/esdt/esdt.address.service';
import { NftAccount } from 'src/endpoints/nfts/entities/nft.account';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { CachingService } from '@elrondnetwork/erdnest';
import { PluginService } from 'src/common/plugins/plugin.service';
import { Nft } from 'src/endpoints/nfts/entities/nft';
import { ScamType } from 'src/common/entities/scam-type.enum';


describe('Nft Service', () => {
  let nftService: NftService;

  const mockNftAccount: NftAccount = {
    identifier: 'MOS-b9b4b2-2710',
    collection: 'MOS-b9b4b2',
    timestamp: undefined,
    attributes: 'dGFnczpTdHJhbW9zaSxSb21hbmlhLEVscm9uZCxSb21hbmlhREFPO21ldGFkYXRhOlFtVVVoQW1CUUtHa1NxTjc3NU5aQUFZVWFxZDhzc01hZEZnMlVZU0VDU0VSejYvOTE0Lmpzb24=',
    nonce: 10000,
    type: NftType.NonFungibleESDT,
    name: 'Stramosi #10000',
    creator: 'erd1qqqqqqqqqqqqqpgq0p9k56lutyjsz288gsrtu64nfj43ll8vys5sjy7luv',
    royalties: 10,
    uris: [
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1VVWhBbUJRS0drU3FONzc1TlpBQVlVYXFkOHNzTWFkRmcyVVlTRUNTRVJ6Ni85MTQucG5n',
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1VVWhBbUJRS0drU3FONzc1TlpBQVlVYXFkOHNzTWFkRmcyVVlTRUNTRVJ6Ni85MTQuanNvbg==',
      'aHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1VVWhBbUJRS0drU3FONzc1TlpBQVlVYXFkOHNzTWFkRmcyVVlTRUNTRVJ6Ni9jb2xsZWN0aW9uLmpzb24=',
    ],
    url: 'https://media.elrond.com/nfts/asset/QmUUhAmBQKGkSqN775NZAAYUaqd8ssMadFg2UYSECSERz6/914.png',
    media: undefined,
    isWhitelistedStorage: true,
    thumbnailUrl: '',
    tags: ['Stramosi', 'Romania', 'Elrond', 'RomaniaDAO'],
    metadata: undefined,
    owner: 'erd15gculjmu3r62ldlwyguqdgddez35r2lv6ka8j7s6pwhqlc80httqljzwgm',
    balance: '',
    supply: undefined,
    decimals: undefined,
    ticker: '',
    scamInfo: undefined,
    price: undefined,
    valueUsd: undefined,
    score: undefined,
    isNsfw: undefined,
    rank: undefined,
    rarities: undefined,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });


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
      filters.collection = 'CPA-c6d2fb';
      filters.type = NftType.NonFungibleESDT;

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filters);

      for (const nft of nfts) {
        expect(nft.collection).toStrictEqual("CPA-c6d2fb");
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

    it(`should verify if all returned nfts from a specific collection contain the owner property`, async () => {
      const filters = new NftFilter();
      filters.collection = "MOS-b9b4b2";

      const options = new NftQueryOptions();
      options.withOwner = true;

      const results = await nftService.getNfts({ from: 0, size: 500 }, filters, options);

      const nftsOwner = results.map((result) => result.owner);

      expect(nftsOwner).toBeDefined();
      expect(nftsOwner.length).toStrictEqual(500);
    });

    it("should verify if all esdt of type NonFungibleTokens contains owner property and need to be defined", async () => {
      const options = new NftQueryOptions();
      options.withOwner = true;

      const nfts = await nftService.getNfts({ from: 50, size: 25 }, { type: NftType.NonFungibleESDT }, options);
      const nftOwners = nfts.map((nft) => nft.owner);

      expect(nftOwners).toHaveLength(25);
    });

    it("should verify if all esdt of type SemiFungibleESDT contains owner property and need to be defined", async () => {
      const options = new NftQueryOptions();
      options.withOwner = true;

      const nfts = await nftService.getNfts({ from: 50, size: 25 }, { type: NftType.SemiFungibleESDT }, options);
      const nftOwners = nfts.map((nft) => nft.owner);

      expect(nftOwners).toHaveLength(25);
    });

    it('should return all esdt of type NonFungibleESDT details from two collections', async () => {
      const filter = new NftFilter();
      filter.collections = ["EROBOT-527a29", "COLLARV2-467a53"];

      const results = await nftService.getNfts({ from: 0, size: 10 }, filter);

      for (const result of results) {
        expect(result.type).toStrictEqual('NonFungibleESDT');
      }
    });

    it('should return nft details with search filter applied and expect that collection name to be found based on search term', async () => {
      const filter = new NftFilter();
      filter.search = 'eRobots';

      const results = await nftService.getNfts({ from: 0, size: 1 }, filter);

      for (const result of results) {
        expect(result.collection).toStrictEqual('EROBOT-527a29');
      }
    });

    it('should return 10 nfts that have uris defined', async () => {
      const filter = new NftFilter();
      filter.hasUris = true;

      const results = await nftService.getNfts({ from: 0, size: 10 }, filter);
      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.uris).toBeDefined();
      }
    });

    it.skip('should return 10 nfts that have isWhitelisted property true', async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      const filter = new NftFilter();
      filter.hasUris = true;

      const results = await nftService.getNfts({ from: 0, size: 10 }, filter);
      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.isWhitelistedStorage).toStrictEqual(true);
      }
    });

    it('should return 10 nfts that have timestamp > 1654630698 ', async () => {
      const filter = new NftFilter();
      filter.after = 1654630698;

      const results = await nftService.getNfts({ from: 0, size: 10 }, filter);
      expect(results.length).toStrictEqual(10);

      for (const result of results) {
        expect(result.timestamp).toBeGreaterThanOrEqual(1654630698);
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

    it("should return the number of nfts with collection filter applied", async () => {
      const filters = new NftFilter();
      filters.collections = ['EROBOT-527a29', 'MEDAL-ae074f'];

      const count = await nftService.getNftCount(filters);

      expect(count).toBeGreaterThanOrEqual(100);
    });

    it("should return 0 if one collection isWhitelistedStorage = true ", async () => {
      const filters = new NftFilter();
      filters.collection = "LKMEX-f4d898";
      filters.isWhitelistedStorage = true;

      const count = await nftService.getNftCount(filters);
      expect(count).toStrictEqual(0);
    });

    it("should return 10000 nfts if collection isWhitelistedStorage ", async () => {
      const filters = new NftFilter();
      filters.collection = "MOS-b9b4b2";
      filters.isWhitelistedStorage = true;

      const count = await nftService.getNftCount(filters);
      expect(count).toStrictEqual(10000);
    });

    it("should return total nfts count from a specific nonce range ", async () => {
      const filters = new NftFilter();
      filters.collection = "EBULB-36c762";
      filters.nonceAfter = 30;
      filters.nonceBefore = 40;

      const count = await nftService.getNftCount(filters);
      expect(count).toStrictEqual(11);
    });

    it(`should return total number of nfts from address with type MetaESDT`, async () => {
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

    it("should return a list of NonFungibleESDT for a specific address without supply even if withSupply property is true", async () => {
      const address: string = "erd1yl6f7cq9gpuprwthxf0c2gsvmnuezwqkqmzf8e40u87t7592af7qpl05cv";
      const options = new NftQueryOptions();
      options.withSupply = true;

      const results = await nftService.getNftsForAddress(address, { from: 0, size: 100 }, { type: NftType.NonFungibleESDT }, options);

      for (const result of results) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result.supply).not.toBeDefined();
      }
    });

    it("when withSupply property is false should return a list of tokens (NonFungible, SemiFungibleESDT, MetaESDT) without supply attribute applied", async () => {
      const address: string = "erd1yl6f7cq9gpuprwthxf0c2gsvmnuezwqkqmzf8e40u87t7592af7qpl05cv";
      const options = new NftQueryOptions();
      options.withSupply = false;

      const nftResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.NonFungibleESDT }, options);
      for (const result of nftResults) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result.supply).not.toBeDefined();
      }

      const sftResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.SemiFungibleESDT }, options);
      for (const result of sftResults) {
        expect(result.type).toStrictEqual(NftType.SemiFungibleESDT);
        expect(result.supply).not.toBeDefined();
      }

      const metaEsdtResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.MetaESDT }, options);
      for (const result of metaEsdtResults) {
        expect(result.type).toStrictEqual(NftType.MetaESDT);
        expect(result.supply).not.toBeDefined();
      }
    });

    it("should return a list of nfts for a specific address with supply attribute applied only for SemiFungibleESDT and MetaESDT", async () => {
      const address: string = "erd1yl6f7cq9gpuprwthxf0c2gsvmnuezwqkqmzf8e40u87t7592af7qpl05cv";
      const options = new NftQueryOptions();
      options.withSupply = true;

      const nftResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.NonFungibleESDT }, options);
      for (const result of nftResults) {
        expect(result.type).toStrictEqual(NftType.NonFungibleESDT);
        expect(result.supply).not.toBeDefined();
      }

      const sftResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.SemiFungibleESDT }, options);
      for (const result of sftResults) {
        expect(result.type).toStrictEqual(NftType.SemiFungibleESDT);
        expect(result.supply).toBeDefined();
      }

      const metaEsdtResults = await nftService.getNftsForAddress(address, { from: 0, size: 5 }, { type: NftType.MetaESDT }, options);
      for (const result of metaEsdtResults) {
        expect(result.type).toStrictEqual(NftType.MetaESDT);
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
    it("should return one nft for a specific account", async () => {
      jest
        .spyOn(EsdtAddressService.prototype, 'getNftsForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => [mockNftAccount]));

      const address: string = "erd15gculjmu3r62ldlwyguqdgddez35r2lv6ka8j7s6pwhqlc80httqljzwgm";
      const identifier: string = "MOS-b9b4b2-2710";
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

    it("should return undefined if account does not contains an nft", async () => {
      jest
        .spyOn(EsdtAddressService.prototype, 'getNftsForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const address: string = "erd15gculjmu3r62ldlwyguqdgddez35r2lv6ka8j7s6pwhqlc80httqljzwgm";
      const identifier: string = "MOS-b9b4b2-2710";
      const results = await nftService.getNftForAddress(address, identifier);

      expect(results).toBeUndefined();
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

    it('should return undefined because test simulates that the given identifier is not an nft', async () => {
      const identifier: string = 'WEGLD-bd4d79';
      const results = await nftService.getNftOwners(identifier, { from: 0, size: 1 });

      expect(results).toBeUndefined();
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

    it('should return undefined', async () => {
      jest.spyOn(NftService.prototype, 'getNftsInternal')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_pagination: QueryPagination, _filter: NftFilter, _identifier?: string) => []));

      const identifier: string = " ";
      const result = await nftService.getSingleNft(identifier);

      expect(result).toBeUndefined();
    });
  });

  describe("Get NFT Identifier Media", () => {
    it("should verify if nft media is defined and receive same value", async () => {
      const identifier: string = "EROBOT-527a29-c4";
      const filter = new NftFilter();
      filter.identifiers = [identifier];

      const singleNft = await nftService.getSingleNft(identifier);
      const nfts = await nftService.getNfts({ from: 0, size: 1 }, filter);

      if (!singleNft) {
        throw new Error("Properties are not defined");
      }
      for (const nft of nfts) {
        expect(nft.media).toStrictEqual(singleNft.media);
      }
    });
  });

  describe('getNftSupply', () => {
    it('should return nft supply details', async () => {
      const identifier: string = "EROBOT-527a29-c4";
      const result = await nftService.getNftSupply(identifier);

      expect(result).toStrictEqual("1");
    });

    it('should return undefined because test simulates that identifier does not have the correct format', async () => {
      const identifier: string = "EROBOT527a29c4";
      const result = await nftService.getNftSupply(identifier);

      expect(result).toBeUndefined();
    });

    it('should return undefined because test simulates that nft length is equal with 0', async () => {
      jest.spyOn(NftService.prototype, 'getNftsInternal')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_pagination: QueryPagination, _filter: NftFilter, _identifier?: string) => []));

      const identifier: string = 'EROBOT-527a29-c4';
      const result = await nftService.getNftSupply(identifier);

      expect(result).toBeUndefined();
    });
  });

  describe('getNftOwnersCount', () => {
    it('should return total number of esdts token', async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest.spyOn(NftService.prototype, 'getNftOwnersCountRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_dentifier: string) => 1));

      const identifier: string = "EROBOT-527a29";
      const result = await nftService.getNftOwnersCount(identifier);

      expect(result).toStrictEqual(1);
    });

    it('should return undefined because test simulates that esdt owners are null', async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));

      jest.spyOn(NftService.prototype, 'getNftOwnersCountRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_dentifier: string) => null));

      const identifier: string = "EROBOT-527a29";
      const result = await nftService.getNftOwnersCount(identifier);

      expect(result).toBeUndefined();
    });
  });

  describe('NFT scam info', () => {
    beforeEach(() => {
      jest
        .spyOn(PluginService.prototype, 'batchProcessNfts')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (nfts: Nft[], withScamInfo?: boolean | undefined) => {
          for (const nft of nfts) {
            if (withScamInfo == true) {
              nft.scamInfo = { type: ScamType.potentialScam };
            }
          }
        }));

      jest
        .spyOn(PluginService.prototype, 'processNfts')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (nft: Nft[], _withScamInfo?: boolean) => {
          for (const item of nft) {
            if (item.collection == 'LOTTERY-7cae2f') {
              item.scamInfo = { type: ScamType.potentialScam };
            }
          }

        }));
    });

    it("should return a list of NFTs with scam info property present", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: true });

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeDefined();
        expect(nft.scamInfo?.type).toStrictEqual(ScamType.potentialScam);
      }
    });

    it("should return a list of address NFTs with scam info property present", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: true });

      const nfts = await nftService.getNftsForAddress('erd1ar8gg37lu2reg5zpmtmqawqe65fzfsjd2v3p4m993xxjnu8azssq86f24k', { from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeDefined();
        expect(nft.scamInfo?.type).toStrictEqual(ScamType.potentialScam);
      }
    });

    it("should return a list of NFTs without scam info property", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: false });

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeDefined();
      }
    });

    it("should return a list of address NFTs without scam info property", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: false });

      const nfts = await nftService.getNftsForAddress('erd1ar8gg37lu2reg5zpmtmqawqe65fzfsjd2v3p4m993xxjnu8azssq86f24k', { from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeDefined();
      }
    });

    it("should return scam info for NFT", async () => {
      const identifier = 'LOTTERY-7cae2f-01';

      const nft = await nftService.getSingleNft(identifier);

      expect(nft?.scamInfo).toBeDefined();
      expect(nft?.scamInfo?.type).toStrictEqual(ScamType.potentialScam);
    });

    it("should not return scam info for NFT", async () => {
      const identifier = 'TSTMNT-700bfc-01';

      const nft = await nftService.getSingleNft(identifier);

      expect(nft?.scamInfo).toBeUndefined();
    });

    it("should return scam info for address NFT", async () => {
      const identifier = 'LOTTERY-7cae2f-01';

      const nft = await nftService.getNftForAddress('erd1ar8gg37lu2reg5zpmtmqawqe65fzfsjd2v3p4m993xxjnu8azssq86f24k', identifier);

      expect(nft?.scamInfo).toBeDefined();
      expect(nft?.scamInfo?.type).toStrictEqual(ScamType.potentialScam);
    });

    it("should not return scam info for address NFT", async () => {
      const identifier = 'TSTMNT-700bfc-01';

      const nft = await nftService.getNftForAddress('erd1dv9sw8a2hy3lv98p3sdqazy420j48wtn3vs9q74ezuamv64tcxrqqxquxv', identifier);

      expect(nft?.scamInfo).toBeUndefined();
    });
  });

  describe('NFT Scam Info (without mocking)', () => {
    it("should return a list of NFTs without scam info property", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: false });

      const nfts = await nftService.getNfts({ from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeUndefined();
      }
    });

    it("should return a list of address NFTs without scam info property", async () => {
      const filter = new NftFilter({ collection: 'LOTTERY-7cae2f' });

      const options = new NftQueryOptions({ withScamInfo: false });

      const nfts = await nftService.getNftsForAddress('erd1ar8gg37lu2reg5zpmtmqawqe65fzfsjd2v3p4m993xxjnu8azssq86f24k', { from: 0, size: 10 }, filter, options);

      for (const nft of nfts) {
        expect(nft.scamInfo).toBeUndefined();
      }
    });
  });

  describe('getNfts', () => {
    it('should return a list of NFTs from a specific collection filtered by nonceAfter', async () => {
      const collection: string = "EBULB-36c762";
      const filter = new NftFilter();
      filter.collection = collection;
      filter.nonceAfter = 30;

      const results = await nftService.getNfts(new QueryPagination({ size: 3 }), filter);

      for (const result of results) {
        expect(result.collection).toStrictEqual(collection);
      }
      const nftNonce = results.map((nft) => nft.nonce);
      expect(nftNonce.includes(50)).toBeTruthy();
      expect(nftNonce.includes(49)).toBeTruthy();
      expect(nftNonce.includes(48)).toBeTruthy();

      const nftIdentifier = results.map((nft) => nft.identifier);
      expect(nftIdentifier.includes("EBULB-36c762-32")).toBeTruthy();
      expect(nftIdentifier.includes("EBULB-36c762-31")).toBeTruthy();
      expect(nftIdentifier.includes("EBULB-36c762-30")).toBeTruthy();
    });

    it('should return a list of NFTs from a specific collection filtered by nonceBefore', async () => {
      const collection: string = "EBULB-36c762";
      const filter = new NftFilter();
      filter.collection = collection;
      filter.nonceBefore = 30;

      const results = await nftService.getNfts(new QueryPagination({ size: 3 }), filter);

      for (const result of results) {
        expect(result.collection).toStrictEqual(collection);
      }
      const nftNonce = results.map((nft) => nft.nonce);
      expect(nftNonce.includes(30)).toBeTruthy();
      expect(nftNonce.includes(29)).toBeTruthy();
      expect(nftNonce.includes(28)).toBeTruthy();

      const nftIdentifier = results.map((nft) => nft.identifier);
      expect(nftIdentifier.includes("EBULB-36c762-1e")).toBeTruthy();
      expect(nftIdentifier.includes("EBULB-36c762-1d")).toBeTruthy();
      expect(nftIdentifier.includes("EBULB-36c762-1c")).toBeTruthy();
    });
  });
});
