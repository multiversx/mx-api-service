import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { TokenService } from 'src/endpoints/tokens/token.service';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { TokenFilter } from 'src/endpoints/tokens/entities/token.filter';
import { TokenWithBalance } from "../../endpoints/tokens/entities/token.with.balance";
import { EsdtService } from 'src/endpoints/esdt/esdt.service';


describe('Token Service', () => {
  let tokenService: TokenService;
  let esdtService: EsdtService;
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
    esdtService = moduleRef.get<EsdtService>(EsdtService);

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
      const count = await tokenService.getTokenCount(new TokenFilter());
      expect(typeof count).toBe('number');
    });
  });

  describe('Specific token', () => {
    it(`should return a token with a specific identifier`, async () => {
      const token = await tokenService.getToken(tokenIdentifier);

      if (token) {
        expect(token.identifier).toBe(tokenIdentifier);
        expect(token.name).toBe(tokenName);
      }
    });

    it(`should throw 'Token not found' error`, async () => {
      expect(await tokenService.getToken(tokenIdentifier + 'a')).toBeUndefined();
    });
  });

  describe('Get Token Roles', () => {
    it(`should return token roles`, async () => {
      const roles = await tokenService.getToken(tokenIdentifier);

      if (roles) {
        const value = await tokenService.getTokenRoles(roles.identifier);
        expect(value).toBeInstanceOf(Array);
      }
    });
  });

  describe('Get Token Accounts', () => {
    it(`should return tokens with size of 10`, async () => {
      const token = await tokenService.getToken(tokenIdentifier);

      if (token) {
        const tokensList = await tokenService.getTokenAccounts({ from: 0, size: 10 }, token.name);
        expect(tokensList).toBeInstanceOf(Array);
      }
    });
  });

  describe('Get Token For Address', () => {
    it(`should return tokens for a specific address`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = tokenIdentifier;
      const token = await tokenService.getTokenForAddress(address, tokenIdentifier);
      expect(token).toBeInstanceOf(TokenWithBalance);
    });
  });

  describe('Get All Tokens For Address', () => {
    it(`should return all tokens for address`, async () => {
      const tokenFilter = new TokenFilter();
      const tokens = await tokenService.getAllTokensForAddress(address, tokenFilter);
      expect(tokens).toBeInstanceOf(Array);
    });
  });

  describe('Get Token Accounts Count', () => {
    it(`should return the count of token from a specific account`, async () => {
      const tokenFilter = new TokenFilter();
      tokenFilter.identifier = 'MSFT-532e00';
      const count = await esdtService.getTokenAccountsCount(tokenFilter.identifier);
      expect(count).toBe(1);
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
      const count = await tokenService.getTokenSupply(identifier);
      expect(count).toBeInstanceOf(Object);
      expect(count).toHaveProperty('totalSupply');
      expect(count).toHaveProperty('circulatingSupply');
    });
  });

  describe('Get Token Role For Address', () => {
    it(`should return undefined if address does not contain identifier`, async () => {
      const role = await tokenService.getTokenRolesForAddress(identifier, address);
      expect(role).toBeUndefined();
    });
  });
});