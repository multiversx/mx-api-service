import { Test } from '@nestjs/testing';
import { TokenService } from 'src/endpoints/tokens/token.service';
import { TokenFilter } from 'src/endpoints/tokens/entities/token.filter';
import { TokenWithBalance } from "../../endpoints/tokens/entities/token.with.balance";
import { TokenDetailed } from "../../endpoints/tokens/entities/token.detailed";
import { TokenAccount } from "../../endpoints/tokens/entities/token.account";
import { TokenAddressRoles } from 'src/endpoints/tokens/entities/token.address.roles';
import tokenDetails from '../data/esdt/token/token.example';
import { TokenModule } from 'src/endpoints/tokens/token.module';
import '../../utils/extensions/jest.extensions';

describe('Token Service', () => {
  let tokenService: TokenService;

  const address: string = 'erd1xcm2sjlwg4xeqxzvuyhx93kagleewgz9rnw9hs5rxldfjk7nh9ksmznyyr';
  const identifier: string = 'EGLDRIDE-7bd51a';
  const tokenName: string = 'CheckerChain';

  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [TokenModule],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);

    const tokens = await tokenService.getTokens(
      { from: 0, size: 1 },
      new TokenFilter(),
    );
    expect(tokens).toHaveLength(1);
  });

  describe('Tokens list', () => {
    describe('Tokens pagination', () => {
      it(`should return a list with 25 tokens`, async () => {
        const tokens = await tokenService.getTokens({ from: 0, size: 25 }, new TokenFilter());
        expect(tokens).toHaveLength(25);

        for (const token of tokens) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });

      it(`should return a list with 10 tokens`, async () => {
        const tokens = await tokenService.getTokens({ from: 0, size: 10 }, new TokenFilter());
        expect(tokens).toHaveLength(10);

        for (const token of tokens) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });
    });

    describe('Tokens filters', () => {
      it(`should return a list of tokens for a collection`, async () => {
        const tokens = await tokenService.getTokens({ from: 0, size: 50 }, { name: tokenName });
        expect(tokens).toBeInstanceOf(Array);
        expect(tokens).toHaveLength(1);

        expect(tokens[0].name).toBe(tokenName);
        expect(tokens[0]).toHaveStructure(Object.keys(new TokenDetailed()));
      });

      it(`should return a list with tokens that has identifiers`, async () => {
        const tokenFilter = new TokenFilter();
        tokenFilter.identifiers = ['IGNIS-b208a9', 'CHECKR-60108b', 'invalidIdentifier'];
        const tokens = await tokenService.getTokens({ from: 0, size: 25 }, tokenFilter);

        for (const token of tokens) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
        expect(tokens.length).toEqual(2);
        const nftsIdentifiers = tokens.map((nft) => nft.identifier);
        expect(nftsIdentifiers.includes('IGNIS-b208a9')).toStrictEqual(true);
        expect(nftsIdentifiers.includes('CHECKR-60108b')).toStrictEqual(true);
      });

      it(`should return an empty tokens list`, async () => {
        const tokenFilter = new TokenFilter();
        tokenFilter.identifiers = ['LKFARM-9d1ea8-8fb5', 'LKFARM-9d1ea8-8fb6'];
        const tokens = await tokenService.getTokens({ from: 0, size: 25 }, tokenFilter);

        expect(tokens.length).toEqual(0);
        expect(tokens).toBeInstanceOf(Array);
      });
    });
  });

  describe('Tokens count', () => {
    it(`should return tokens count`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = tokenDetails.identifier;

      const count = await tokenService.getTokenCount(tokenFilter);
      expect(typeof count).toBe('number');
    });
  });

  describe('Specific token', () => {
    it(`should return a specific token based on identifier`, async () => {
      const token = await tokenService.getToken(tokenDetails.identifier);
      if (!token) {
        throw new Error('Token is not defined');
      }

      expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
    });

    it('Should return undefined token', async () => {
      const token = await tokenService.getToken(tokenDetails.identifier + 'a');
      expect(token).toBeUndefined();
    });
  });

  describe('Get Token Roles', () => {
    it(`should return token roles`, async () => {
      const roles = await tokenService.getTokenRoles(tokenDetails.identifier);
      if (!roles) {
        throw new Error('Token roles are not defined');
      }

      for (const role of roles) {
        expect(role).toHaveStructure(Object.keys(new TokenAddressRoles()));
      }
    });

    it(`should return undefined`, async () => {
      const roles = await tokenService.getTokenRoles(tokenDetails.identifier + 'a');
      expect(roles).toBeUndefined();
    });
  });

  describe('Get Token Accounts', () => {
    it(`should return a list with 5 tokens accounts`, async () => {
      const tokens = await tokenService.getTokenAccounts({ from: 0, size: 5 }, tokenDetails.identifier);
      expect(tokens.length).toBe(5);

      for (const token of tokens) {
        expect(token).toHaveStructure(Object.keys(new TokenAccount()));
      }
    });
  });

  describe('Get Token For Address', () => {
    it(`should return token for a specific address`, async () => {
      const token = await tokenService.getTokenForAddress(tokenDetails.owner, tokenDetails.identifier);
      expect(token).toHaveStructure(Object.keys(new TokenWithBalance()));
    });
  });

  describe('Get All Tokens For Address', () => {
    it(`should return one token for a specific address`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = tokenDetails.identifier;

      const tokens = await tokenService.getAllTokensForAddress(tokenDetails.owner, tokenFilter);
      expect(tokens.length).toBeGreaterThan(0);

      for (const token of tokens) {
        expect(token).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Tokens For Address', () => {
    it(`should return all tokens for address`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = 'MEX-455c57';
      const tokenAddress = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
      const tokens = await tokenService.getTokensForAddress(tokenAddress, { from: 0, size: 1 }, tokenFilter);

      expect(tokens.length).toBe(1);

      for (const token of tokens) {
        expect(token).toHaveStructure(Object.keys(new TokenWithBalance()));
      }
    });
  });

  describe('Get Token Supply', () => {
    it(`should return token supply`, async () => {
      const supply = await tokenService.getTokenSupply(tokenDetails.identifier);

      if (!supply) {
        throw new Error('Properties not defined');
      }

      expect(typeof supply).toBe('object');
      expect(supply.hasOwnProperty('supply')).toBe(true);
      expect(supply.hasOwnProperty('circulatingSupply')).toBe(true);
    });

    it(`should return undefined if identifier token is invalid`, async () => {
      const invalidIdentifier = 'invalidIdentifier';
      const supply = await tokenService.getTokenSupply(invalidIdentifier);
      expect(supply).toBeUndefined();
    });
  });

  describe('Get Token Role For Address', () => {
    it(`should return undefined if address does not contain identifier`, async () => {
      const roles = await tokenService.getTokenRolesForAddress(identifier, address);
      expect(roles).toBeUndefined();
    });
  });

  describe('Get Token Count For Address', () => {
    it(`should return token count for address`, async () => {
      const count = await tokenService.getTokenCountForAddress(tokenDetails.owner);
      expect(typeof count).toBe('number');
    });
  });
});
