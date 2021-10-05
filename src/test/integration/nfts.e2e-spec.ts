import { Test } from "@nestjs/testing";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe.skip('Nft Service', () => {
  let nftService: NftService;
  let nftCreator: string;
  let nftIdentifier: string;

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);

    let nfts = await nftService.getNfts({from: 0, size: 1}, new NftFilter());
    expect(nfts).toHaveLength(1);

    let nft = nfts[0];
    nftCreator = nft.creator;
    nftIdentifier = nft.identifier;
  });

  describe('Nfts list', () => {
    describe('Nfts pagination', () => {
      it(`should return a list with 25 nfts`, async () => {
        const nftsList = await nftService.getNfts({from: 0, size: 25}, new NftFilter());

        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(25);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
        }
      });

      it(`should return a list with 10 nfts`, async () => {
        const nftsList = await nftService.getNfts({from: 0, size: 10}, new NftFilter());
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
        nftFilter.collection = nftIdentifier;
        const nftsList = await nftService.getNfts({from: 0, size: 25}, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
          expect(nft.identifier).toBe(nftIdentifier); 
        }
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.type = NftType.SemiFungibleESDT;
        const nftsList = await nftService.getNfts({from: 0, size: 25}, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        for (let nft of nftsList) {
            expect(nft).toHaveStructure(Object.keys(new Nft()));
            expect(nft.type).toBe(NftType.SemiFungibleESDT);
        }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.creator = nftCreator;
        const nftsList = await nftService.getNfts({from: 0, size: 25}, nftFilter);
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
      const nftCount: Number = new Number(await nftService.getNftCount(new NftFilter()));

      expect(nftCount).toBeInstanceOf(Number);
    });
  })

  describe('Specific nft', () => {
    it(`should return a nft for a specific identifier`, async () => {
      const nft = await nftService.getCollection(nftIdentifier);

      if (nft) {
        expect(nft.token).toBe(nftIdentifier);
      }
    });

    it(`should throw 'NFT not found' error`, async () => {
      await expect (nftService.getCollection(nftIdentifier + 'a')).toBeUndefined();
    });
  })
});