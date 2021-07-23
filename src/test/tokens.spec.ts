import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { TokenController } from 'src/endpoints/tokens/token.controller';
import { TokenDetailed } from 'src/endpoints/tokens/entities/token.detailed';
import { Nft } from 'src/endpoints/tokens/entities/nft';
import { NftType } from 'src/endpoints/tokens/entities/nft.type';

expect.extend({
    toHaveStructure(received: any, keys: string[]) {
        const objectSortedKeys = JSON.stringify(Object.keys(received).sort());
        const expectedKeys = JSON.stringify(keys.sort());

        const pass = objectSortedKeys === expectedKeys;
        if (pass) {
            return {
                pass: true,
                message: () => `expected ${Object.keys(received)} not to be a valid ${keys} `,
            }
        } 
        else {
            return {
                pass: false,
                message: () => `expected ${Object.keys(received)} to be a valid ${keys} `,
            }
        }
    },
});

describe('Token Controller', () => {
  let tokenController: TokenController;
  let tokenName: string;
  let tokenIdentifier: string;
  let nftCreator: string;
  let nftIdentifier: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenController = moduleRef.get<TokenController>(TokenController);

    let nfts = await tokenController.getNfts(0, 1, undefined, undefined, undefined, undefined, undefined, undefined);
    expect(nfts).toHaveLength(1);

    let nft = nfts[0];
    nftCreator = nft.creator;
    nftIdentifier = nft.identifier;

    let tokens = await tokenController.getTokens(0, 1, undefined);
    expect(tokens).toHaveLength(1);

    let token = tokens[0];
    tokenName = token.name;
    tokenIdentifier = token.identifier;
  });

  describe('Tokens list', () => {
    describe('Tokens pagination', () => {
      it(`should return a list with 25 tokens`, async () => {
        const tokensList = await tokenController.getTokens(0, 25, undefined);

        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList).toHaveLength(25);

        for (let token of tokensList) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });

      it(`should return a list with 10 tokens`, async () => {
        const tokensList = await tokenController.getTokens(0, 10, undefined);
        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList).toHaveLength(10);

        for (let token of tokensList) {
          expect(token).toHaveStructure(Object.keys(new TokenDetailed()));
        }
      });
    })

    describe('Tokens filters', () => {
      it(`should return a list of tokens for a collection`, async () => {
        const tokensList = await tokenController.getTokens(0, 50, tokenName);
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
      const tokensCount: Number = new Number(await tokenController.getTokenCount(undefined));

      expect(tokensCount).toBeInstanceOf(Number);
    });
  })

  describe('Specific token', () => {
    it(`should return a token for a specific identifier`, async () => {
      const token = await tokenController.getToken(tokenIdentifier);

      expect(token.identifier).toBe(tokenIdentifier);
      expect(token.name).toBe(tokenName)
    });

    it(`should throw 'Token not found' error`, async () => {
      await expect(tokenController.getToken(tokenIdentifier + 'a')).rejects.toThrowError('Token not found');
    });
  })


  describe('Nfts list', () => {
    describe('Nfts pagination', () => {
      it(`should return a list with 25 nfts`, async () => {
        const nftsList = await tokenController.getNfts(0, 25, undefined, undefined, undefined, undefined, undefined, undefined);

        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(25);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
        }
      });

      it(`should return a list with 10 nfts`, async () => {
        const nftsList = await tokenController.getNfts(0, 10, undefined, undefined, undefined, undefined, undefined, undefined);
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
        const nftsList = await tokenController.getNfts(0, 25, undefined, undefined, tokenIdentifier, undefined, undefined, undefined);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
          expect(nft.identifier).toBe(tokenIdentifier); 
        }
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
          const nftsList = await tokenController.getNfts(0, 25, undefined, NftType.SemiFungibleESDT, undefined, undefined, undefined, undefined);
          expect(nftsList).toBeInstanceOf(Array);

          for (let nft of nftsList) {
              expect(nft).toHaveStructure(Object.keys(new Nft()));
              expect(nft.type).toBe(NftType.SemiFungibleESDT);
          }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nftsList = await tokenController.getNfts(0, 25, undefined, undefined, undefined, undefined, nftCreator, undefined);
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
      const nftCount: Number = new Number(await tokenController.getNftCount(undefined, undefined, undefined, undefined, undefined, undefined));

      expect(nftCount).toBeInstanceOf(Number);
    });
  })

  describe('Specific nft', () => {
    it(`should return a nft for a specific identifier`, async () => {
      const nft = await tokenController.getNft(nftIdentifier);

      expect(nft.identifier).toBe(nftIdentifier);
    });

    it(`should throw 'NFT not found' error`, async () => {
      await expect(tokenController.getNft(nftIdentifier + 'a')).rejects.toThrowError('NFT not found');
    });
  })

});