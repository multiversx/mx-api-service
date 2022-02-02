import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { TokenService } from 'src/endpoints/tokens/token.service';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { TokenFilter } from 'src/endpoints/tokens/entities/token.filter';
import {TokenWithBalance} from "../../endpoints/tokens/entities/token.with.balance";
import tokenDetails from "../mocks/esdt/token/tokenDetails";
import tokensIdentifier from "../mocks/esdt/token/tokenDetails";

describe('Token Service', () => {
  let tokenService: TokenService;
  let tokenName: string;
  let tokenIdentifier: string;

  const address: string = 'erd1xcm2sjlwg4xeqxzvuyhx93kagleewgz9rnw9hs5rxldfjk7nh9ksmznyyr';
  const identifier: string = 'EGLDRIDE-7bd51a';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);

    const tokens = await tokenService.getTokens(
      { from: 0, size: 1 },
      new TokenFilter(),
    );
    expect(tokens).toHaveLength(1);

    const token = tokens[0];
    tokenName = token.name;
    tokenIdentifier = token.identifier;
  }, Constants.oneHour() * 1000);

  describe('Tokens list', () => {
    describe('Tokens pagination', () => {
      it(`should return a list with 25 tokens`, async () => {
        const tokens = await tokenService.getTokens(
          { from: 0, size: 25 },
          new TokenFilter(),
        );

        expect(tokens).toBeInstanceOf(Array);
        expect(tokens).toHaveLength(25);
      });

      it(`should return a list with 10 tokens`, async () => {
        const tokens = await tokenService.getTokens(
          { from: 0, size: 10 },
          new TokenFilter(),
        );
        expect(tokens).toBeInstanceOf(Array);
        expect(tokens).toHaveLength(10);
      });
    });

    describe('Tokens filters', () => {
      it(`should return a list of tokens for a collection`, async () => {
        const tokens = await tokenService.getTokens(
          { from: 0, size: 50 },
          { name: tokenName },
        );
        expect(tokens).toBeInstanceOf(Array);

        for (const token of tokens) {
          expect(token.name).toBe(tokenName);
        }
      });

      it(`should return a list with tokens that has identifiers`, async () => {
        const tokenFilter = new TokenFilter();
        tokenFilter.identifiers = ['MSFT-532e00', 'EWLD-e23800', 'invalidIdentifier'];
        const tokens = await tokenService.getTokens({ from: 0, size: 25 }, tokenFilter);
        expect(tokens).toBeInstanceOf(Array);

        expect(tokens.length).toEqual(2);
        const nftsIdentifiers = tokens.map((nft) => nft.identifier);
        expect(nftsIdentifiers.includes('MSFT-532e00')).toBeTruthy();
        expect(nftsIdentifiers.includes('EWLD-e23800')).toBeTruthy();
      });

      it(`should return an empty tokens list`, async () => {
        const tokenFilter = new TokenFilter();
        tokenFilter.identifiers = ['LKFARM-9d1ea8-8fb5', 'LKFARM-9d1ea8-8fb6'];
        const tokens = await tokenService.getTokens({ from: 0, size: 25 }, tokenFilter);
        expect(tokens).toBeInstanceOf(Array);

        expect(tokens.length).toEqual(0);
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

      expect(token?.owner).toEqual(tokensIdentifier.owner);
      expect(token?.minted).toEqual(tokensIdentifier.minted);
      expect(token?.decimals).toEqual(tokensIdentifier.decimals);
      expect(token?.identifier).toEqual(tokensIdentifier.identifier);

    });

    it(`should throw 'Token not found' error`, async () => {
      expect(await tokenService.getToken(tokenDetails.identifier + 'a')).toBeUndefined();
    });
  });

  describe('Get Token Roles', () => {
    it(`should return token roles`, async () => {
      const roles = await tokenService.getTokenRoles(tokenDetails.identifier);
      expect(roles).toBeInstanceOf(Array);
    });
    it(`should return undefined`, async () => {
      const roles = await tokenService.getTokenRoles(tokenDetails.identifier + 'a');
      expect(roles).toBeUndefined();
    });
  });

  describe('Get Token Accounts', () => {
    it(`should return a list with 5 tokens accounts`, async () => {
      const tokens = await tokenService.getTokenAccounts({from: 0, size: 5}, tokenDetails.identifier);
      expect(tokens.length).toBe(5);
      expect(tokens).toBeInstanceOf(Object);

      for (const token of tokens) {
        expect(token).toHaveProperty('address');
        expect(token).toHaveProperty('balance');
      }
    });
  });

  describe('Get Token For Address', () => {
    it(`should return token for a specific address`, async () => {
      const tokens = await tokenService.getTokenForAddress(tokenDetails.owner, tokenDetails.identifier);
			expect(tokens).toBeInstanceOf(TokenWithBalance);

      if (tokens) {
        expect(tokens.owner).toEqual(tokenDetails.owner);
        expect(tokens.name).toEqual(tokenDetails.name);
        expect(tokens.decimals).toEqual(tokenDetails.decimals);
      }
    });
    it('should return undefined if tokens length < 0', async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = tokenDetails.identifier;

      const tokens = await tokenService.getTokenForAddress(tokenDetails.owner, tokenDetails.identifier);
      const tokenLength = await tokenService.getFilteredTokens(tokenFilter);

      if(!tokenLength.length){
        expect(tokens).toBeUndefined();
      }
    });
  });

  describe('Get All Tokens For Address', () => {
    it(`should return one token for a specific address`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = tokenDetails.identifier;

      const tokens = await tokenService.getAllTokensForAddress(tokenDetails.owner, tokenFilter);
      expect(typeof tokens.length).toBe('number');

      for (const token of tokens) {
        expect(token.identifier).toEqual(tokenDetails.identifier);
        expect(token.name).toEqual(tokenDetails.name);
        expect(token.owner).toEqual(tokenDetails.owner);
      }
    });
  });

  describe('Get Tokens For Address', () => {
    it(`should return all tokens for address`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifiers = [tokenIdentifier];
      const token = await tokenService.getTokensForAddress(address, {
        from: 0,
        size: 25,
      }, tokenFilter);
      expect(token).toBeInstanceOf(Array);
    });
  });

  describe('Get Token Supply', () => {
    it(`should return token supply`, async () => {
      const supply = await tokenService.getTokenSupply(tokenDetails.identifier);
      expect(supply?.totalSupply).toEqual(tokenDetails.supply);
      expect(supply?.circulatingSupply).toEqual(tokenDetails.circulatingSupply);
    });
    it(`should return undefined if identifier token is invalid`, async () => {
      const invalidIdentifier = 'invalidIdentifier';
      const supply = await tokenService.getTokenSupply(invalidIdentifier);
      expect(supply).toBeUndefined();
    });
  });

  describe('Get Token Role For Address', () => {
    it(`should return undefined if address does not contain identifier`, async () => {
      const role = await tokenService.getTokenRolesForAddress(identifier, address);
      expect(role).toBeUndefined();
    });
  });

  describe('Get Token Count For Address', () => {
    it(`should return token count for address`, async () => {
      const count = await tokenService.getTokenCountForAddress(tokenDetails.owner);
      expect(typeof count).toBe('number');
    });
  });
});
