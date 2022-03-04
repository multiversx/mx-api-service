import { TokenFilter } from '../../endpoints/tokens/entities/token.filter';
import { Test } from '@nestjs/testing';
import { TokenService } from 'src/endpoints/tokens/token.service';
import { PublicAppModule } from 'src/public.app.module';
import { TokenDetailed } from 'src/endpoints/tokens/entities/token.detailed';
import { TokenAddressRoles } from 'src/endpoints/tokens/entities/token.address.roles';
import { TokenAccount } from 'src/endpoints/tokens/entities/token.account';
import { TokenWithBalance } from 'src/endpoints/tokens/entities/token.with.balance';
import '../../utils/extensions/jest.extensions';

describe('Token Service', () => {
  let tokenService: TokenService;


  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);

  });

  describe("Get Tokens with filters", () => {
    it("should return a list of 10 tokens", async () => {
      const results = await tokenService.getTokens({ from: 0, size: 10 }, new TokenFilter());

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
      }
    });

    it("should return a list of tokens based on identifiers parameter", async () => {
      const filter = new TokenFilter();
      filter.identifiers = ["RIDE-7d18e9", "MEX-455c57"];

      const results = await tokenService.getTokens({ from: 0, size: 2 }, filter);

      const nftsIdentifiers = results.map((nft) => nft.identifier);
      expect(nftsIdentifiers.includes('RIDE-7d18e9')).toStrictEqual(true);
      expect(nftsIdentifiers.includes('MEX-455c57')).toStrictEqual(true);
    });

    it("should return one token based on identifier parameter", async () => {
      const filter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";

      const results = await tokenService.getTokens({ from: 0, size: 1 }, filter);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
        expect(results).toHaveLength(1);
      }
    });

    it("should return one token based on name parameter", async () => {
      const filter = new TokenFilter();
      filter.name = "holoride";

      const results = await tokenService.getTokens({ from: 0, size: 1 }, filter);

      for (const result of results) {
        expect(results).toHaveLength(1);
        expect(result.name).toStrictEqual("holoride");
        expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
      }
    });

    it("should return one token based on search parameter", async () => {
      const filter = new TokenFilter();
      filter.search = "RIDE-7d18e9";

      const results = await tokenService.getTokens({ from: 0, size: 1 }, filter);

      for (const result of results) {
        expect(results).toHaveLength(1);
        expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
      }
    });
  });

  describe("Get Token", () => {
    it("should return token details", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getToken(identifier);

      expect(result).toHaveStructure(Object.keys(new TokenDetailed()));
    });

    it("should verify if tokens properties are defined", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getToken(identifier);

      if (!result) {
        throw new Error("Properties are not defined");
      }
      expect(result.hasOwnProperty("identifier")).toBeTruthy();
      expect(result.hasOwnProperty("name")).toBeTruthy();
      expect(result.hasOwnProperty("ticker")).toBeTruthy();
      expect(result.hasOwnProperty("owner")).toBeTruthy();
      expect(result.hasOwnProperty("minted")).toBeTruthy();
      expect(result.hasOwnProperty("burnt")).toBeTruthy();
      expect(result.hasOwnProperty("decimals")).toBeTruthy();
      expect(result.hasOwnProperty("isPaused")).toBeTruthy();
      expect(result.hasOwnProperty("assets")).toBeTruthy();
      expect(result.hasOwnProperty("transactions")).toBeTruthy();
      expect(result.hasOwnProperty("accounts")).toBeTruthy();
    });

    it("should return tokens properties", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getToken(identifier);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.canUpgrade).toBeTruthy();
      expect(result.canMint).toBeFalsy();
      expect(result.canBurn).toBeFalsy();
      expect(result.canChangeOwner).toBeTruthy();
      expect(result.canPause).toBeFalsy();
      expect(result.canFreeze).toBeFalsy();
      expect(result.canWipe).toBeFalsy();
    });

    it("should contain supply and circulatingSupply", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getToken(identifier);

      if (!result) {
        throw new Error("Properties are not defined");
      }

      expect(result.supply).toBeDefined();
      expect(result.circulatingSupply).toBeDefined();
    });
  });

  //TBD
  describe("Get Tokens Roles", () => {
    it("should return token roles", async () => {
      const identifier: string = "RIDE-7d18e9";
      const results = await tokenService.getTokenRoles(identifier);

      if (!results) {
        throw new Error('Token roles are not defined');
      }

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenAddressRoles()));
      }
    });

    it("should return token role for address", async () => {
      const identifier: string = "RIDE-7d18e9";
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const result = await tokenService.getTokenRolesForAddress(address, identifier);

      expect(result).toBeUndefined();
    });
  });

  describe("Get Token Accounts", () => {
    it(`should return 10 accounts of token "holoride"`, async () => {
      const identifier: string = "RIDE-7d18e9";
      const results = await tokenService.getTokenAccounts({ from: 0, size: 10 }, identifier);

      expect(results).toHaveLength(10);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenAccount()));
      }
    });

    it("should verify if pagination filter returns different accounts (from = 0 != from = 1 )", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result_1 = await tokenService.getTokenAccounts({ from: 0, size: 1 }, identifier);
      const result_2 = await tokenService.getTokenAccounts({ from: 1, size: 2 }, identifier);

      expect(result_1).not.toStrictEqual(result_2);
    });
  });

  describe("Get Token Supply", () => {
    it("should return token supply", async () => {
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getTokenSupply(identifier);

      if (!result) {
        throw new Error('Properties not defined');
      }

      expect(result.hasOwnProperty('supply')).toBe(true);
      expect(result.hasOwnProperty('circulatingSupply')).toBe(true);
    });

    it(`should return undefined if identifier token is invalid`, async () => {
      const invalidIdentifier = 'invalidIdentifier';
      const supply = await tokenService.getTokenSupply(invalidIdentifier);
      expect(supply).toBeUndefined();
    });
  });

  describe("Get Token Count", () => {
    it("should return token count based on identifier property", async () => {
      const filter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(1);
      expect(typeof result).toStrictEqual("number");
    });

    it("should return token count based on identifiers property", async () => {
      const filter = new TokenFilter();
      filter.identifiers = ["RIDE-7d18e9", "MEX-455c57"];

      const result = await tokenService.getTokenCount(filter);

      expect(result).toStrictEqual(2);
      expect(typeof result).toStrictEqual("number");
    });

    it("should return token count based on name property", async () => {
      const filter = new TokenFilter();
      filter.name = "holoride";

      const result = await tokenService.getTokenCount(filter);

      expect(typeof result).toStrictEqual("number");
    });

    it("should return token count for a specific address", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const result = await tokenService.getTokenCountForAddress(address);

      expect(typeof result).toStrictEqual("number");
    });
  });

  describe("Get Token For Address", () => {
    it("should return one token for a specific address", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const identifier: string = "RIDE-7d18e9";
      const result = await tokenService.getTokenForAddress(address, identifier);

      expect(result).toHaveStructure(Object.keys(new TokenWithBalance()));
    });
  });

  describe("Get Tokens For Address", () => {
    it("should return one token details for a specific address based on identifier property filter", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const filter = new TokenFilter();
      filter.identifier = "RIDE-7d18e9";
      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);

      expect(results).toHaveLength(1);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenWithBalance()));
        expect(result.identifier).toStrictEqual("RIDE-7d18e9");
      }
    });

    it("should return one token details for a specific address based on name property filter", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const filter = new TokenFilter();
      filter.name = "holoride";
      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);

      expect(results).toHaveLength(1);

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new TokenWithBalance()));
        expect(result.name).toStrictEqual("holoride");
      }
    });

    //TBD
    it("should return two tokens details for a specific address based on identifiers property filter", async () => {
      const address: string = "erd19w6f7jqnf4nqrdmq0m548crrc4v3dmrxtn7u3dngep2r078v30aqzzu6nc";
      const filter = new TokenFilter();
      filter.identifiers = ["RIDE-7d18e9", "MEX-455c57"];

      const results = await tokenService.getTokensForAddress(address, { from: 0, size: 1 }, filter);
      const nftsIdentifiers = results.map((nft) => nft.identifier);

      expect(nftsIdentifiers.includes('RIDE-7d18e9')).toStrictEqual(true);
      // expect(nftsIdentifiers.includes('MEX-455c57')).toStrictEqual(true);
    });
  });
});
