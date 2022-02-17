import { Test } from "@nestjs/testing";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { NftOwner } from "src/endpoints/nfts/entities/nft.owner";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import userAccount from "../data/accounts/user.account";
import { NftModule } from "src/endpoints/nfts/nft.module";

describe('Nft Service', () => {
  let nftService: NftService;
  let nftCreator: string;

  const nftsIdentifier: string = 'LKLP-03a2fa-0d270d';
  const invalidIdentifier: string = 'MEXFARM-e7af524edf42';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NftModule],
    }).compile();

    nftService = moduleRef.get<NftService>(NftService);

    const nfts = await nftService.getNfts({ from: 0, size: 1 }, new NftFilter());
    expect(nfts).toHaveLength(1);

    const nft = nfts[0];
    nftCreator = nft.creator;
  });

  describe('Nfts list', () => {

    describe('Nfts pagination', () => {
      it(`should return a list with 25 nfts`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, new NftFilter());

        expect(nfts.length).toBe(25);

        for (const nft of nfts) {
          expect(nft).toHaveProperty('identifier');
          expect(nft).toHaveProperty('collection');
          expect(nft).toHaveProperty('timestamp');

          expect(nft).toBeInstanceOf(Nft);
        }
      });

      it(`should return a list with 10 nfts`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 10 }, new NftFilter());

        expect(nfts.length).toBe(10);

        for (const nft of nfts) {
          expect(nft).toHaveProperty('identifier');
          expect(nft).toHaveProperty('collection');
          expect(nft).toHaveProperty('timestamp');

          expect(nft).toBeInstanceOf(Nft);
        }
      });
    });

    describe('Nfts filters', () => {
      it(`should return a list with all nfts within a collection`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, { collection: 'LKMEX-aab910' });

        expect(nfts).toBeInstanceOf(Array);
        expect(nfts.length).toStrictEqual(25);

        for (const nft of nfts) {
          expect(nft.collection).toStrictEqual('LKMEX-aab910');
        }
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.SemiFungibleESDT });

        expect(nfts).toBeInstanceOf(Array);
        expect(nfts.length).toStrictEqual(25);

        for (const nft of nfts) {
          expect(nft.type).toStrictEqual(NftType.SemiFungibleESDT);
        }
      });

      it(`should return a list with NonFungibleESDT tokens`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.NonFungibleESDT });

        expect(nfts).toBeInstanceOf(Array);
        expect(nfts.length).toStrictEqual(25);

        for (const nft of nfts) {
          expect(nft.type).toStrictEqual(NftType.NonFungibleESDT);
        }
      });

      it(`should return a list with MetaESDT tokens`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, { type: NftType.MetaESDT });

        expect(nfts).toBeInstanceOf(Array);
        expect(nfts.length).toStrictEqual(25);

        for (const nft of nfts) {
          expect(nft.type).toStrictEqual(NftType.MetaESDT);
        }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, { creator: nftCreator });

        for (const nft of nfts) {
          expect(nft).toBeInstanceOf(Nft);
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

      it(`should return a list with nfts that has collection`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.collection = 'EGLDMEXF-5bcc57';
        const nfts = await nftService.getNfts({ from: 0, size: 25 }, nftFilter);
        expect(nfts).toBeInstanceOf(Array);

        const nftsCollection = nfts.map((nft) => nft.collection).distinct();
        expect(nftsCollection.length).toStrictEqual(1);
        expect(nftsCollection[0]).toStrictEqual('EGLDMEXF-5bcc57');
      });

      it(`should return a empty nfts list`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.identifiers = ['MSFT-532e00'];
        const nfts = await nftService.getNfts({ from: 0, size: 1 }, nftFilter);

        for (const nft of nfts) {
          expect(nft).toHaveStructure(Object.keys(new Nft()));
        }
      });
    });
  });

  describe('Nft count', () => {
    it(`should return a number`, async () => {
      const nftCount = await nftService.getNftCount(new NftFilter());
      expect(typeof nftCount).toBe('number');
    });
  });

  describe('Get Single NFT', () => {
    it(`should return a list with nfts that has collection`, async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'EGLDMEXF-5bcc57-353d44';
      const nft = await nftService.getSingleNft(nftFilter.identifier);
      if (!nft) {
        throw new Error('Nft properties are not defined');
      }

      expect(nft.identifier).toStrictEqual('EGLDMEXF-5bcc57-353d44');
      expect(nft).toBeInstanceOf(Nft);
    });

    it('should return undefined if nft is missing', async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'invalidIdentifier';
      const nfts = await nftService.getSingleNft(nftFilter.identifier);
      expect(nfts).toBeUndefined();
    });
  });

  describe('Get NFT Owner Count', () => {
    it(`should return NFT Owner count = 1`, async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'EGLDMEXF-5bcc57-377c9f';
      const count = await nftService.getNftOwnersCount(nftFilter.identifier);

      expect(typeof count).toBe('number');
    });
  });

  describe('Get Nft Owners Count', () => {
    it(`should return a list with nfts that has collection`, async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'EGLDMEXF-5bcc57-377c9f';
      const nfts = await nftService.getNftOwnersCountRaw(nftFilter.identifier);

      expect(typeof nfts).toBe('number');
    });
  });

  describe('Get NFT Count', () => {
    it(`should return Nft count`, async () => {
      const count = await nftService.getNftCount({ type: NftType.NonFungibleESDT });
      expect(typeof count).toBe('number');
    });
  });

  describe('Get NFT For Address', () => {
    it(`should return Nft for address without NftQueryOptions`, async () => {
      const nfts = await nftService.getNftsForAddress(userAccount.address, { from: 0, size: 10 }, { type: NftType.NonFungibleESDT });

      expect(nfts).toBeInstanceOf(Array);

      for (const nft of nfts) {
        expect(nft).toHaveStructure(Object.keys(new NftAccount()));
      }
    });
  });

  describe('Get NFT Count For Address', () => {
    it(`should return Nft count for address`, async () => {
      const count = await nftService.getNftCountForAddress(userAccount.address, { type: NftType.NonFungibleESDT });
      expect(typeof count).toBe('number');
    });
  });

  describe('Get Nft Supply', () => {
    it('should return nft supply', async () => {
      const supply = await nftService.getNftSupply(nftsIdentifier);
      const supplyNumber = Number(supply);

      expect(supplyNumber).toBeGreaterThanOrEqual(0);
    });

    it('should return undefined if identifier is invalid', async () => {
      const supply = await nftService.getNftSupply(invalidIdentifier);
      expect(supply).toBeUndefined();
    });
  });

  describe('Get Nft Owners', () => {
    it('should return nft owners', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', { from: 0, size: 1 });
      if (!owners) {
        throw new Error('Nft properties are not defined');
      }

      for (const owner of owners) {
        expect(owner).toHaveStructure(Object.keys(new NftOwner()));
      }
    });

    it('nft owner has only 1 address', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', { from: 0, size: 1 });
      if (!owners) {
        throw new Error('Nft properties are not defined');
      }

      expect(owners.length).toBe(1);
    });
  });
});
