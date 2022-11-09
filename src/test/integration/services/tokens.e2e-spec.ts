import { EsdtService } from 'src/endpoints/esdt/esdt.service';
import { TokenService } from 'src/endpoints/tokens/token.service';
import { PublicAppModule } from 'src/public.app.module';
import { TokenDetailed } from 'src/endpoints/tokens/entities/token.detailed';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Test } from '@nestjs/testing';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { TokenDetailedWithBalance } from 'src/endpoints/tokens/entities/token.detailed.with.balance';
import { TokenSort } from 'src/endpoints/tokens/entities/token.sort';
import { SortOrder } from 'src/common/entities/sort.order';
import { TokenWithRolesFilter } from 'src/endpoints/tokens/entities/token.with.roles.filter';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { CachingService, ElasticQuery, ElasticService, FileUtils } from '@elrondnetwork/erdnest';
import { GatewayModule } from 'src/common/gateway/gateway.module';
import { TokenFilter } from 'src/endpoints/tokens/entities/token.filter';
import { EsdtLockedAccount } from 'src/endpoints/esdt/entities/esdt.locked.account';

describe('Token Service', () => {
  let tokenService: TokenService;
  let apiConfigService: ApiConfigService;

  const token = {
    identifier: 'WEGLD-bd4d79',
    name: 'WrappedEGLD',
    ticker: 'WEGLD',
    owner: 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97',
    minted: '0',
    burnt: '0',
    decimals: 18,
    isPaused: false,
    assets: {
      website: 'https://maiar.exchange',
      description: 'wEGLD is an ESDT token that has the same value as EGLD, the native coin of the Elrond blockchain.',
      ledgerSignature: '3044022062a68d4bdd649aebb5e4ed5c6284e211c689c3b8142e59a47b01cc9997b16dfa0220475b064836849b9c4aa9c5ff18daed91a64f847bd96aa0a26768349f2cd0c24f',
      status: 'active',
      pngUrl: 'https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.png',
      svgUrl: 'https://media.elrond.com/tokens/asset/WEGLD-bd4d79/logo.svg',
    },
    transactions: 6839938,
    accounts: 91702,
    canUpgrade: true,
    canMint: true,
    canBurn: true,
    canChangeOwner: true,
    canPause: true,
    canFreeze: true,
    canWipe: true,
    supply: '1861656',
    circulatingSupply: '1861656',
  };

  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule, GatewayModule],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getTokens", () => {
    it("should return a list of 3 tokens", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));


      const results = await tokenService.getTokens({ from: 0, size: 3 }, new TokenFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
          expect.objectContaining({ identifier: "MEX-455c57" }),
        ])
      );
    });

    it("should return a list with one token and identifier filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.identifier = "WEGLD-bd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokens({ from: 0, size: 1 }, new TokenFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
        ])
      );
    });

    it("should return a list of tokens with the identifiers filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.identifiers = ["WEGLD-bd4d79", "RIDE-7d18e9"];

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokens({ from: 0, size: 2 }, new TokenFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it("should return a list of one token with the name filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.name = "WrappedEGLD";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokens({ from: 0, size: 1 }, new TokenFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "WrappedEGLD" }),
        ])
      );
    });

    it("should return a list of one token with the search filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.search = "WEGLD-bd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokens({ from: 0, size: 1 }, new TokenFilter());

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
        ])
      );
    });

    it("should verify if token have structure of TokenDetailed", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokens({ from: 0, size: 1 }, new TokenFilter());

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
      }
    });
  });

  describe("getToken", () => {
    it("should return a specific token", async () => {

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => token));

      const result = await tokenService.getToken("WEGLD-bd4d79");

      if (!result) {
        throw new Error("Token not found");
      }
      expect(result.identifier).toStrictEqual("WEGLD-bd4d79");
    });

    it("should return undefined because test simulates that token is undefined", async () => {

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const result = await tokenService.getToken('');

      expect(result).toBeUndefined();
    });
  });

  describe("getFilteredTokens", () => {
    it("should return a list of tokens with search filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.search = "WEGLD-bd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
        ])
      );
    });

    it("should return a list of tokens with name filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.name = "WrappedEGLD";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "WrappedEGLD" }),
        ])
      );
    });

    it("should return a list of tokens with identifier filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.identifier = "WEGLD-bd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
        ])
      );
    });

    it("should return a list of tokens with identifiers filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.identifiers = ["WEGLD-bd4d79", "RIDE-7d18e9"];

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it("should return an empty token list if tokens are undefined", async () => {
      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const results = await tokenService.getFilteredTokens(new TokenFilter());

      expect(results).toStrictEqual([]);
    });

    it("should verify if first returned elemenent (accounts) is always 0 because test simulates that order of the list is ascending by accounts", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.sort = TokenSort.accounts;
      filter.order = SortOrder.asc;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "CRB-62d525" }),
          expect.objectContaining({ accounts: 1 }),
        ])
      );
    });

    it("should verify if first returned elemenent (transactions) is always 1 because test simulates that order of the list is ascending by transactions", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.sort = TokenSort.transactions;
      filter.order = SortOrder.asc;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "CRB-62d525" }),
          expect.objectContaining({ transactions: 1 }),
        ])
      );
    });

    it("should return a list of tokens in ascending order sorted by price and first element in array should be WEGLD-bd4d79", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter = new TokenFilter();
      filter.sort = TokenSort.price;
      filter.order = SortOrder.asc;

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getFilteredTokens(filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
        ])
      );
    });
  });

  it("should return a list of tokens ordered descending by accounts", async () => {
    const MOCK_PATH = apiConfigService.getMockPath();
    const filter = new TokenFilter();
    filter.sort = TokenSort.accounts;
    filter.order = SortOrder.desc;

    jest
      .spyOn(CachingService.prototype, 'getOrSetCache')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async () =>
        FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

    const results = await tokenService.getFilteredTokens(filter);

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ identifier: "WEGLD-bd4d79" }),
      ])
    );
  });


  it("should return a list of tokens in ascending order sorted by marketCap and first element in array should be WEGLD-bd4d79", async () => {
    const MOCK_PATH = apiConfigService.getMockPath();
    const filter = new TokenFilter();
    filter.sort = TokenSort.marketCap;
    filter.order = SortOrder.asc;

    jest
      .spyOn(CachingService.prototype, 'getOrSetCache')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async () =>
        FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

    const results = await tokenService.getFilteredTokens(filter);

    expect(results[0].identifier).toStrictEqual('WEGLD-bd4d79');
  });

  describe("getTokenCount", () => {
    it("should return token count based on identifier filter", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter: TokenFilter = new TokenFilter();
      filter.identifier = "WEGLD-bd4d79";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(1);
    });

    it("should return tokens count based on identifiers filter", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const filter: TokenFilter = new TokenFilter();
      filter.identifiers = ["WEGLD-bd4d79", "RIDE-7d18e9"];

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(2);
    });

    //TBD: count filtered by name of WrappedEGLD = 5
    // it.only("should return tokens count based on name filter", async () => {
    //   const MOCK_PATH = apiConfigService.getMockPath();
    //   const filter: TokenFilter = new TokenFilter();
    //   filter.name = "WrappedEGLD";

    //   jest
    //     .spyOn(ElasticService.prototype, 'get')
    //     // eslint-disable-next-line require-await
    //     .mockImplementation(jest.fn(async () =>
    //       FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

    //   const result = await tokenService.getTokenCount(filter);
    //   console.log(result)

    // });

    // it("should return tokens count based on search filter", async () => {
    //   const MOCK_PATH = apiConfigService.getMockPath();
    //   const filter: TokenFilter = new TokenFilter();
    //   filter.search = "WrappedEGLD";

    //   jest
    //     .spyOn(ElasticService.prototype, 'get')
    //     // eslint-disable-next-line require-await
    //     .mockImplementation(jest.fn(async () =>
    //       FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

    //   const result = await tokenService.getTokenCount(filter);

    //   expect(result).toStrictEqual(1);
    // });
  });

  describe("getTokenProperties", () => {
    it("should return all properties for token", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const identifier: string = "WEGLD-bd4d79";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const result = await tokenService.getTokenProperties(identifier);

      expect(result).toHaveProperties([
        'identifier', 'name', 'type', 'owner',
        'decimals', 'isPaused', 'canUpgrade',
        'canMint', 'canBurn', 'canChangeOwner',
        'canPause', 'canFreeze', 'canWipe']);
    });

    it("should return undefined because test simulates that token properties are undefined", async () => {
      const identifier: string = "WEGLD-bd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const result = await tokenService.getTokenProperties(identifier);
      expect(result).toBeUndefined();
    });

    it("should return undefined because test simulates that token format is not correct ( missing - )", async () => {
      const identifier: string = "WEGLDbd4d79";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const result = await tokenService.getTokenProperties(identifier);
      expect(result).toBeUndefined();
    });

    it("should return undefined because test simulates that token type is Fungible ESDT", async () => {
      const identifier: string = "EROBOT-527a29";

      jest
        .spyOn(CachingService.prototype, 'getOrSetCache')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const result = await tokenService.getTokenProperties(identifier);
      expect(result).toBeUndefined();
    });

    //ToDo: properties of TokenType.FungibleESDT

    it('should return undefined because test simulates that token type is not NonfugibleESDT', async () => {
      const identifier: string = 'METAUTKLK-e6a445';
      const result = await tokenService.getTokenProperties(identifier);

      expect(result).toBeUndefined();
    });
  });

  describe("getTokenCountForAddress", () => {
    it("should return total number of tokens for address", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";

      jest
        .spyOn(TokenService.prototype, 'getTokenCountForAddressFromGateway')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => 1));

      const result = await tokenService.getTokenCountForAddress(address);
      expect(result).toStrictEqual(1);
    });

    it("should return total number of tokens for smart contract address", async () => {
      const address: string = "erd1qqqqqqqqqqqqqpgqmqq78c5htmdnws8hm5u4suvags36eq092jpsaxv3e7";

      jest
        .spyOn(TokenService.prototype, 'getTokenCountForAddressFromElastic')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => 1));

      const result = await tokenService.getTokenCountForAddress(address);
      expect(result).toStrictEqual(1);
    });
  });

  describe("getTokensForAddress", () => {
    it("should return a list of tokens for a specific address", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";

      const filter: TokenFilter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it("should return a list of tokens for a specific smart contract address", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd1qqqqqqqqqqqqqpgqmqq78c5htmdnws8hm5u4suvags36eq092jpsaxv3e7";

      const filter: TokenFilter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it("should return an empty list because test simulates that address does not contain a specific token", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";

      const filter: TokenFilter = new TokenFilter();
      filter.identifier = "OXSY-3dc78b";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual([]);
    });
  });

  describe("getTokensForAddressFromElastic", () => {
    it("should return one token for a specific address with source ELASTIC and identifier filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";

      const filter: TokenFilter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddressFromElastic(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it("should return a list of two tokens for a specific address with source ELASTIC and identifiers filter applied", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";

      const filter: TokenFilter = new TokenFilter();
      filter.identifiers = ["WATER-9ed400", "RIDE-7d18e9"];

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddressFromElastic(address, { from: 0, size: 2 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WATER-9ed400" }),
          expect.objectContaining({ identifier: "RIDE-7d18e9" }),
        ])
      );
    });

    it.skip('should return token details with name filter applied ', async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";

      const filter: TokenFilter = new TokenFilter();
      filter.name = 'Water';

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddressFromElastic(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WATER-9ed400" }),
        ])
      );
    });

    it.skip('should return token details with search filter applied ', async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const address: string = "erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8";

      const filter: TokenFilter = new TokenFilter();
      filter.search = 'Water';

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}tokens.mock.json`)));

      const results = await tokenService.getTokensForAddressFromElastic(address, { from: 0, size: 1 }, filter);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ identifier: "WATER-9ed400" }),
        ])
      );
    });
  });

  describe("getTokenSupply", () => {
    it("should return totalSupply and circulatingSupply for token", async () => {
      const identifier: string = token.identifier;
      const result = await tokenService.getTokenSupply(identifier);

      if (!result) {
        throw new Error('Properties not defined');
      }

      expect(result).toHaveProperties(['supply', 'circulatingSupply']);
    });

    it('should return totalSupply details for token in descending order', async () => {
      const identifier: string = "RIDE-7d18e9";
      const results = await tokenService.getTokenSupply(identifier);

      function sorted(array: EsdtLockedAccount[]) {
        return array.every(function (num: any, idx: any, arr: any) {
          return (num <= arr[idx + 1]) || (idx === arr.length - 1) ? 1 : 0;
        });
      }

      if (!results?.lockedAccounts) {
        throw new Error('Property is not defined');
      }

      expect(sorted(results.lockedAccounts)).toBeTruthy();
    });

    it("should return undefined because test simulates that token properties are not defined", async () => {
      const identifier: string = token.identifier;

      jest
        .spyOn(TokenService.prototype, 'getTokenProperties')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => undefined));

      const results = await tokenService.getTokenSupply(identifier);
      expect(results).toBeUndefined();
    });
  });

  describe("getTokenAccounts", () => {
    it("should return a list of account witch contains a specific token", async () => {
      const identifier: string = token.identifier;

      const results = await tokenService.getTokenAccounts({ from: 0, size: 10 }, identifier);

      if (!results) {
        throw new Error('Properties not defined');
      }

      expect(results).toHaveLength(10);

      for (const result of results) {
        expect(result).toHaveProperties(['address', 'balance']);
      }
    });

    it("should return undefined because test simulates that properties are not defined", async () => {
      const identifier: string = token.identifier;

      jest
        .spyOn(TokenService.prototype, 'getTokenProperties')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const results = await tokenService.getTokenAccounts({ from: 0, size: 1 }, identifier);
      expect(results).toBeUndefined();
    });
  });

  describe("getTokenAccountsCount", () => {
    it("should return total accounts for a specific token", async () => {
      const identifier: string = token.identifier;

      jest
        .spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => 1000));

      const results = await tokenService.getTokenAccountsCount(identifier);

      expect(results).toStrictEqual(1000);
    });

    it("should return undefined because test simulates that properties are not defined", async () => {
      const identifier: string = token.identifier;

      jest
        .spyOn(TokenService.prototype, 'getTokenProperties')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => undefined));

      const results = await tokenService.getTokenAccountsCount(identifier);
      expect(results).toBeUndefined();
    });
  });

  describe("getTokenRoles", () => {
    it("should return token roles", async () => {
      const identifier: string = token.identifier;

      jest
        .spyOn(EsdtService.prototype, 'getEsdtAddressesRoles')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => [{
          address: "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy",
          canLocalMint: true,
          canLocalBurn: true,
          roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
        },
        {
          address: "erd1qqqqqqqqqqqqqpgqmuk0q2saj0mgutxm4teywre6dl8wqf58xamqdrukln",
          canLocalMint: true,
          canLocalBurn: true,
          roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
        },
        {
          address: 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3',
          canLocalMint: true,
          canLocalBurn: true,
          roles: ['ESDTRoleLocalMint'],
        },
        ]));

      const results = await tokenService.getTokenRoles(identifier);

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
        ])
      );
    });

    it('should return tokens roles from elastic source is IndexerV3FlagActive = true', async () => {
      const identifier: string = token.identifier;

      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      const results = await tokenService.getTokenRoles(identifier);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
          expect.objectContaining({
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          }),
        ])
      );
    });

    it('should return undefined if token identifier is not defined', async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      jest.spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      const results = await tokenService.getTokenRoles('');

      expect(results).toBeUndefined();
    });

    it('should return undefined if token roles are not defined', async () => {
      const identifier: string = token.identifier;

      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      jest
        .spyOn(EsdtService.prototype, 'getEsdtAddressesRoles')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => [
          {
            address: 'erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy',
            canLocalMint: true,
            canLocalBurn: true,
            roles: [''],
          }]));

      jest.spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => identifier));

      const results = await tokenService.getTokenRoles('');

      expect(results).toStrictEqual([]);
    });

    it("should return undefined because test simulates that roles are not defined for token", async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => false));

      const results = await tokenService.getTokenRoles('UNKNOWN');
      expect(results).toStrictEqual([]);
    });
  });

  describe("getTokenRolesForAddress", () => {
    it("should return token roles for a specific address", async () => {
      const identifier: string = token.identifier;
      const address: string = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";

      jest
        .spyOn(EsdtService.prototype, 'getEsdtAddressesRoles')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => [
          {
            address: 'erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy',
            canLocalMint: true,
            canLocalBurn: true,
            roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
          },
        ]));

      const results = await tokenService.getTokenRolesForIdentifierAndAddress(identifier, address);

      expect(results).toEqual(expect.objectContaining({
        canLocalMint: true,
        canLocalBurn: true,
        roles: ['ESDTRoleLocalMint', 'ESDTRoleLocalBurn'],
      }));
    });

    it('should return undefined if token roles are not defined', async () => {
      jest.spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      jest.spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => identifier));

      jest
        .spyOn(EsdtService.prototype, 'getEsdtAddressesRoles')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_identifier: string) => [
          {
            address: 'erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy',
            canLocalMint: true,
            canLocalBurn: true,
            roles: [''],
          }]));

      const address: string = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getTokenRolesForIdentifierAndAddress(identifier, address);

      expect(result).toBeUndefined();
    });

    it("should return undefined because test simulates that roles are not defined for address", async () => {
      const identifier: string = 'RIDE-7d18e9';
      const address: string = "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy";

      jest
        .spyOn(ApiConfigService.prototype, 'getIsIndexerV3FlagActive')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(() => true));

      jest
        .spyOn(ElasticService.prototype, 'getItem')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _key: string, _identifier: string) => undefined));

      const results = await tokenService.getTokenRolesForIdentifierAndAddress(identifier, address);
      expect(results).toBeUndefined();
    });
  });

  //TBD: getTokenForAddress return undefined for SC address
  describe("getTokenForAddress", () => {
    it("should return token for a specific address", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getTokenForAddress(address, identifier);

      expect(result).toHaveStructure(Object.keys(new TokenDetailedWithBalance()));
    });

    it("should return undefined because test simulates that token is not defined for address", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const identifier: string = "RIDE-7d18e9";

      jest
        .spyOn(TokenService.prototype, 'getFilteredTokens')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_filter: TokenFilter) => []));

      const result = await tokenService.getTokenForAddress(address, identifier);
      expect(result).toBeUndefined();
    });
  });

  describe('isToken', () => {
    it('should verify if given identifier is a token and should return true', async () => {
      const result = await tokenService.isToken('RIDE-7d18e9');

      expect(result).toStrictEqual(true);
    });

    it('should return false because esdt identifier is an NonFungibleESDT', async () => {
      const result = await tokenService.isToken('EROBOT-527a29');

      expect(result).toStrictEqual(false);
    });
  });

  describe('getTokenCountForAddressFromElastic', () => {
    it('should return total number of tokens for a specific address from Elastic source', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';
      const result = await tokenService.getTokenCountForAddressFromElastic(address);

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 3));

      expect(result).toStrictEqual(3);
    });
  });

  describe('getTokenCountForAddressFromGateway', () => {
    it('should return total number of tokens for a specific address from Gateway source', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';
      const result = await tokenService.getTokenCountForAddressFromGateway(address);

      expect(result).toStrictEqual(3);
    });
  });

  describe('getTokenCountForAddressFromGateway & getTokenCountForAddressFromElastic', () => {
    it('should return total number of tokens for a specific address from Gateway source', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2';
      const elasticResult = await tokenService.getTokenCountForAddressFromElastic(address);
      const gatewayResult = await tokenService.getTokenCountForAddressFromGateway(address);

      expect(elasticResult).toStrictEqual(gatewayResult);
    });
  });

  describe('getTokensWithRolesForAddressCount', () => {
    it('should return total number of tokens with roles with identifier filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.identifier = 'RIDE-7d18e9';

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 3));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(3);
    });

    it('should return total number of tokens with roles with identifier filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.search = 'RIDE';

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 1));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(1);
    });

    it('should return total number of tokens with roles with owner filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.owner = 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97';

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 1));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(1);
    });

    it('should return total number of tokens with roles with canMint = true property filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.canMint = true;

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 2));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(2);
    });

    it('should return total number of tokens with roles with canMint = false property filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.canMint = false;

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 1));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(1);
    });

    it('should return total number of tokens with roles with canBurn = true property filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.canBurn = true;

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 5));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(5);
    });

    it('should return total number of tokens with roles with canBurn = false property filter for a specific address', async () => {
      const address: string = 'erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc';
      const filter: TokenWithRolesFilter = new TokenWithRolesFilter();
      filter.canBurn = false;

      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 4));

      const result = await tokenService.getTokensWithRolesForAddressCount(address, filter);

      expect(result).toStrictEqual(4);
    });
  });

  describe('getTokenWithRolesForAddress', () => {
    it('should return tokens details with roles for a specific address', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy';
      const identifier: string = 'WEGLD-bd4d79';

      const result = await tokenService.getTokenWithRolesForAddress(address, identifier);

      expect(result).toEqual(expect.objectContaining({
        roles: expect.objectContaining({
          canLocalMint: true,
          canLocalBurn: true,
        }),
      }));
    });

    it('should return undefined because test simulates that identifier is not defined', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy';
      const identifier: string = '';

      jest.spyOn(TokenService.prototype, 'getTokensWithRolesForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string, _filter: TokenWithRolesFilter, _pagination: QueryPagination) => []));

      const result = await tokenService.getTokenWithRolesForAddress(address, identifier);

      expect(result).toBeUndefined();
    });
  });
});
