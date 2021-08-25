import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { TokenDetailed } from 'src/endpoints/tokens/entities/token.detailed';
import { Nft } from 'src/endpoints/tokens/entities/nft';
import { NftType } from 'src/endpoints/tokens/entities/nft.type';
import { TokenService } from 'src/endpoints/tokens/token.service';
import { NftFilter } from 'src/endpoints/tokens/entities/nft.filter';
import "../utils/extensions/jest.extensions";

describe.skip('Token Service', () => {
  let tokenService: TokenService;
  let tokenName: string;
  let tokenIdentifier: string;
  let nftCreator: string;
  let nftIdentifier: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenService = moduleRef.get<TokenService>(TokenService);

    let nfts = await tokenService.getNfts({from: 0, size: 1}, new NftFilter());
    expect(nfts).toHaveLength(1);

    let nft = nfts[0];
    nftCreator = nft.creator;
    nftIdentifier = nft.identifier;

    let tokens = await tokenService.getTokens({from: 0, size: 1}, undefined);
    expect(tokens).toHaveLength(1);

    let token = tokens[0];
    tokenName = token.name;
    tokenIdentifier = token.identifier;
  });

  describe('Tokens list', () => {
    describe('Tokens pagination', () => {
      it(`should return a list with 25 tokens`, async () => {
        const tokensList = await tokenService.getTokens({from: 0, size: 25}, undefined);

        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList).toHaveLength(25);

        for (let token of tokensList) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });

      it(`should return a list with 10 tokens`, async () => {
        const tokensList = await tokenService.getTokens({from: 0, size: 10}, undefined);
        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList).toHaveLength(10);

        for (let token of tokensList) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });
    })

    describe('Tokens filters', () => {
      it(`should return a list of tokens for a collection`, async () => {
        const tokensList = await tokenService.getTokens({from: 0, size: 50}, tokenName);
        expect(tokensList).toBeInstanceOf(Array);

        for (let token of tokensList) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
          expect(token.name).toBe(tokenName);
        }
      });
    });
  });

  describe('Token count', () => {
    it(`should return a number`, async () => {
      const tokensCount: Number = new Number(await tokenService.getTokenCount(undefined));

      expect(tokensCount).toBeInstanceOf(Number);
    });
  })

  describe('Specific token', () => {
    it(`should return a token for a specific identifier`, async () => {
      const token = await tokenService.getToken(tokenIdentifier);

      if (token) {
        expect(token.identifier).toBe(tokenIdentifier);
        expect(token.name).toBe(tokenName);
      }
    });

    it(`should throw 'Token not found' error`, async () => {
      await expect(tokenService.getToken(tokenIdentifier + 'a')).toBeUndefined();
    });
  })


  describe('Nfts list', () => {
    describe('Nfts pagination', () => {
      it(`should return a list with 25 nfts`, async () => {
        const nftsList = await tokenService.getNfts({from: 0, size: 25}, new NftFilter());

        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(25);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
        }
      });

      it(`should return a list with 10 nfts`, async () => {
        const nftsList = await tokenService.getNfts({from: 0, size: 10}, new NftFilter());
        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(10);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));

          expect(nft.creator).toBeDefined();
          expect(nft.identifier).toBeDefined();
        }
      });
    })

    describe('Nfts filters', () => {
      it(`should return a list with all nfts within a collection`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.collection = tokenIdentifier
        const nftsList = await tokenService.getNfts({from: 0, size: 25}, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
          expect(nft.identifier).toBe(tokenIdentifier); 
        }
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.type = NftType.SemiFungibleESDT;
        const nftsList = await tokenService.getNfts({from: 0, size: 25}, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
            expect(nft).toHaveStructure(Object.keys(new Nft()));
            expect(nft.type).toBe(NftType.SemiFungibleESDT);
        }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.creator = nftCreator;
        const nftsList = await tokenService.getNfts({from: 0, size: 25}, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
            expect(nft).toHaveStructure(Object.keys(new Nft()));
            expect(nft.creator).toBe(nftCreator);
        }
      });
    });
  });

  describe('Nft count', () => {
    it(`should return a number`, async () => {
      const nftCount: Number = new Number(await tokenService.getNftCount(new NftFilter()));

      expect(nftCount).toBeInstanceOf(Number);
    });
  })

  describe('Specific nft', () => {
    it(`should return a nft for a specific identifier`, async () => {
      const nft = await tokenService.getNft(nftIdentifier);

      if (nft) {
        expect(nft.token).toBe(nftIdentifier);
      }
    });

    it(`should throw 'NFT not found' error`, async () => {
      await expect (tokenService.getNft(nftIdentifier + 'a')).toBeUndefined();
    });
  })

});