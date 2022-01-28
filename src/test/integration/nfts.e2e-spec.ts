import { Test } from "@nestjs/testing";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { NftQueryOptions } from "../../endpoints/nfts/entities/nft.query.options";

describe('Nft Service', () => {
  let nftService: NftService;
  let nftCreator: string;
  let nftIdentifier: string;

  const nftAddress: string = 'erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl';
  const nftsIdentifier: string = 'LKLP-03a2fa-0d270d';
  const invalidIdentifier: string = 'MEXFARM-e7af524edf42';

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
        const nftsListSemiESDT = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsListSemiESDT).toBeInstanceOf(Array);

        for (const nft of nftsListSemiESDT) {
          expect(nft.type).toBe(NftType.SemiFungibleESDT);
        }
      });

      it(`should return a list with NonFungibleESDT tokens`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.type = NftType.NonFungibleESDT;
        const nftsListNonESDT = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsListNonESDT).toBeInstanceOf(Array);

        for (const nft of nftsListNonESDT) {
          expect(nft.type).toBe(NftType.NonFungibleESDT);
        }
      });

      it(`should return a list with MetaESDT tokens`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.type = NftType.MetaESDT;
        const nftsListMeta = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        expect(nftsListMeta).toBeInstanceOf(Array);

        for (const nft of nftsListMeta) {
          expect(nft.type).toBe(NftType.MetaESDT);
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

      it(`should return true if nft has uri`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.hasUris = true;
        const nftsList = await nftService.getNfts(
          { from: 0, size: 25 },
          nftFilter,
        );
        for (const nft of nftsList) {
          expect(nft).toBeTruthy();
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

        const nftsCollection = nfts.map((nft) => nft.collection);
        expect(nftsCollection.includes('EGLDMEXF-5bcc57')).toBeTruthy();
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
      const nftCount = await nftService.getNftCount(new NftFilter());
      expect(typeof nftCount).toBe('number');
    });
  });

  describe('Get Single NFT', () => {
    it(`should return a list with nfts that has collection`, async () => {
      const nftFilter = new Nft();
      nftFilter.identifier = 'EGLDMEXF-5bcc57-353d44';
      const nfts = await nftService.getSingleNft(nftFilter.identifier);
      expect(nfts).toBeInstanceOf(Nft);
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
      const count =await nftService.getNftOwnersCount(nftFilter.identifier);

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
      const nftFilter = new NftFilter();
      nftFilter.type = NftType.NonFungibleESDT;
      const count = await nftService.getNftCount(nftFilter);
      expect(typeof count).toBe('number');
    });
  });

  describe('Get NFT For Address', () => {
    it(`should return Nft for address without NftQueryOptions`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.type = NftType.NonFungibleESDT;
      const address = 'erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh';
      const nftAddressNFT = await nftService.getNftsForAddress(
        address,
        {
          from: 0,
          size: 10,
        },
        nftFilter,
      );
      for (const nft of nftAddressNFT) {
        expect(nftAddressNFT).toBeInstanceOf(Array);
        expect(nft).toHaveLength(10);
      }
    });
    it(`should return Nft for address with withTimestamp true`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.type = NftType.NonFungibleESDT;
      const nftQueryOption = new NftQueryOptions();
      nftQueryOption.withTimestamp = true;
      const address = 'erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh';
      const nftAddressNFT = await nftService.getNftsForAddress(
        address,
        {
          from: 0,
          size: 10,
        },
        nftFilter,
        nftQueryOption
      );
      for (const nft of nftAddressNFT) {
        expect(nftAddressNFT).toBeInstanceOf(Array);
        expect(nft).toHaveLength(10);
      }
    });
    it(`should return Nft for address with withTimestamp true`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.type = NftType.SemiFungibleESDT;
      const nftQueryOption = new NftQueryOptions();
      nftQueryOption.withTimestamp = true;
      const address = 'erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh';
      const nftAddressSFE = await nftService.getNftsForAddress(
        address,
        {
          from: 0,
          size: 10,
        },
        nftFilter,
        nftQueryOption
      );
      for (const nft of nftAddressSFE) {
        expect(nft).toBeInstanceOf(Array);
        expect(nft).toHaveLength(10);
      }
    });
  });

  describe('Get NFT Count For Address', () => {
    it(`should return Nft count for address`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.type = NftType.NonFungibleESDT;
      const address = 'erd1qqqqqqqqqqqqqpgqye633y7k0zd7nedfnp3m48h24qygm5jl2jpslxallh';
      const count = await nftService.getNftCountForAddress(address, nftFilter);
      expect(typeof count).toBe('number');
    });
  });

  describe('Get GatewayNFT', () => {
    it(`should return a list with nfts`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421'];
      const nftGateway = await nftService.getGatewayNfts(nftAddress, nftFilter);
      expect(nftGateway).toBeInstanceOf(Array);
    });
    it(`should return a list with nfts if identifiers value 2`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421', 'LKMEX-aab910-1d8b28'];
      const nftGateway = await nftService.getGatewayNfts(nftAddress, nftFilter);
      expect(nftGateway).toBeInstanceOf(Array);
    });
  });

  describe('Get NFTs For Address Internal', () => {
    it(`should return a list with nfts from internal address`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421'];
      const nftInternalAddress = await nftService.getNftsForAddressInternal(nftAddress, nftFilter);
      expect(nftInternalAddress).toBeInstanceOf(Array);
    });
  });

  describe('Get Nft Supply', () => {
    it('should return nft supply', async () => {
     return expect(nftService.getNftSupply(nftsIdentifier)).resolves.toEqual(expect.any(String));
    });
    it('should return undefined if identifier is invalid', async () => {
      const supply = await nftService.getNftSupply(invalidIdentifier);
      expect(supply).toBeUndefined();
    });
  });

  describe('Get Nft For Address', () => {
    it('should return undefined if the address does not contain a specific identifier', async () => {
      const nft = await nftService.getNftForAddress(nftAddress, 'LKMEX-aab910-21c8e1');
      expect(nft).toBeUndefined();
    });
  });

  describe('Get Nft Owners', () => {
    it('should return nft owners', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', {from: 0, size: 1});
      expect(owners).toBeInstanceOf(Array);
    });
    it('nft owner has only 1 address', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', {from: 0, size: 1});
      expect(owners?.length).toBe(1);
    });
  });
});
