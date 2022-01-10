import { Test } from "@nestjs/testing";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Nft Service', () => {
  let nftService: NftService;
  let nftCreator: string;
  let nftIdentifier: string;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftCreator = nft.creator;
    nftIdentifier = nft.identifier;
  }, Constants.oneHour() * 1000);

  describe('Nfts list', () => {
    describe('Nfts pagination', () => {
      it(`should return a list with 25 nfts`, async () => {
        const nftsList = await nftService.getNfts(
          { from: 0, size: 25 },
          new NftFilter(),
        );

        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(25);
      });

      it(`should return a list with 10 nfts`, async () => {
        const nftsList = await nftService.getNfts(
          { from: 0, size: 10 },
          new NftFilter(),
        );
        expect(nftsList).toBeInstanceOf(Array);
        expect(nftsList).toHaveLength(10);

        for (const nft of nftsList) {
          expect(nft.creator).toBeDefined();
          expect(nft.identifier).toBeDefined();
        }
      });
    });

    describe('Nfts filters', () => {
      it(`should return a list with all nfts within a collection`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.collection = nftIdentifier;
        const nftsList = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsList).toBeInstanceOf(Array);

        for (const nft of nftsList) {
          expect(nft.identifier).toBe(nftIdentifier);
        }
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.type = NftType.SemiFungibleESDT;
        const nftsList = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsList).toBeInstanceOf(Array);

        for (const nft of nftsList) {
          expect(nft.type).toBe(NftType.SemiFungibleESDT);
        }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.creator = nftCreator;
        const nftsList = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsList).toBeInstanceOf(Array);

        for (const nft of nftsList) {
          expect(nft.creator).toBe(nftCreator);
        }
      });

      it(`should return a list with nfts that has identifiers`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.identifiers = ['LKFARM-9d1ea8-8f6b', 'LKLP-03a2fa-4cc9', 'invalidIdentifier'];
        const nftsList = await nftService.getNfts({ from: 0, size: 25 }, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        expect(nftsList.length).toEqual(2);
        const nftsIdentifiers = nftsList.map((nft) => nft.identifier);
        expect(nftsIdentifiers.includes('LKFARM-9d1ea8-8f6b')).toBeTruthy();
        expect(nftsIdentifiers.includes('LKLP-03a2fa-4cc9')).toBeTruthy();
      });

      it(`should return a empty nfts list`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.identifiers = ['MSFT-532e00'];
        const nftsList = await nftService.getNfts({ from: 0, size: 25 }, nftFilter);
        expect(nftsList).toBeInstanceOf(Array);

        expect(nftsList.length).toEqual(0);
      });
    });
  });

  describe('Nft count', () => {
    it(`should return a number`, async () => {
      const nftCount: Number = new Number(
        await nftService.getNftCount(new NftFilter()),
      );

      expect(nftCount).toBeInstanceOf(Number);
    });
  });
});
