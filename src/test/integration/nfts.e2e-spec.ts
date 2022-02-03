import { Test } from "@nestjs/testing";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftService } from "src/endpoints/nfts/nft.service";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import { Nft } from "../../endpoints/nfts/entities/nft";
import { NftQueryOptions } from "../../endpoints/nfts/entities/nft.query.options";
import { NftOwner } from "src/endpoints/nfts/entities/nft.owner";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { GatewayNft } from "src/endpoints/nfts/entities/gateway.nft";
import userAccount from "../mocks/accounts/user.account";

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
        const nftsList = await nftService.getNfts({ from: 0, size: 25 }, new NftFilter());
       
        if(!nftsList){
          throw new Error('Nft properties are not defined');
        }

        for(const nft of nftsList){
          expect(nft).toBeInstanceOf(Nft);
        }
        expect(nftsList.length).toBe(25);
      });

      it(`should return a list with 10 nfts`, async () => {
        const nftsList = await nftService.getNfts({ from: 0, size: 10 }, new NftFilter());
       
        if(!nftsList){
          throw new Error('Nft properties are not defined');
        }

        for(const nft of nftsList){
          expect(nft).toBeInstanceOf(Nft);
        }
        expect(nftsList.length).toBe(10);
      });
    });

    describe('Nfts filters', () => {
      it(`should return a list with all nfts within a collection`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.collection = nftIdentifier;
        const nftsList = await nftService.getNfts({ from: 0, size: 25 }, nftFilter);

        for (const nft of nftsList) {
          expect(nft.identifier).toBe(nftIdentifier);
        }
        expect(nftsList).toBeInstanceOf(Array);
      });

      it(`should return a list with SemiFungibleESDT tokens`, async () => {
        const nftsListSemiESDT = await nftService.getNfts({ from: 0, size: 25 }, {type: NftType.SemiFungibleESDT});

        for (const nft of nftsListSemiESDT) {
          expect(nft.type).toBe(NftType.SemiFungibleESDT);
        }
        expect(nftsListSemiESDT).toBeInstanceOf(Array);
      });

      it(`should return a list with NonFungibleESDT tokens`, async () => {
        const nftsListNonESDT = await nftService.getNfts({ from: 0, size: 25 }, {type: NftType.NonFungibleESDT});

        for (const nft of nftsListNonESDT) {
          expect(nft.type).toBe(NftType.NonFungibleESDT);
        }
        expect(nftsListNonESDT).toBeInstanceOf(Array);
      });

      it(`should return a list with MetaESDT tokens`, async () => {
        const nftsListMeta = await nftService.getNfts({ from: 0, size: 25 }, {type: NftType.MetaESDT});

        for (const nft of nftsListMeta) {
          expect(nft.type).toBe(NftType.MetaESDT);
        }
      });

      it(`should return a list with all nfts of the creator`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.creator = nftCreator;
        const nftsList = await nftService.getNfts({ from: 0, size: 25 }, nftFilter);

        if(!nftsList){
          throw new Error('Nft properties are not defined');
        }
  
        for(const nft of nftsList){
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

        const nftsCollection = nfts.map((nft) => nft.collection);
        expect(nftsCollection.includes('EGLDMEXF-5bcc57')).toBeTruthy();
        expect(nfts).toBeInstanceOf(Array);
      });


      it(`should return a empty nfts list`, async () => {
        const nftFilter = new NftFilter();
        nftFilter.identifiers = ['MSFT-532e00'];
        const nftsList = await nftService.getNfts({ from: 0, size: 1 }, nftFilter);

        if(!nftsList){
          throw new Error('Nft properties are not defined');
        }
  
        for(const nft of nftsList){
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
      const nfts = await nftService.getSingleNft(nftFilter.identifier);

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }

      expect(nfts.identifier).toBeDefined();
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
      const count = await nftService.getNftCount({type: NftType.NonFungibleESDT});
      expect(typeof count).toBe('number');
    });
  });

  describe('Get NFT For Address', () => {
    it(`should return Nft for address without NftQueryOptions`, async () => {
      const nfts = await nftService.getNftsForAddress( userAccount.address, {from: 0, size: 10}, {type: NftType.NonFungibleESDT});

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }

      for(const nft of nfts){
        expect(nft).toHaveStructure(Object.keys(new NftAccount()));
      }
    });

    it(`should return Nft for address with withTimestamp true`, async () => {
      const nftQueryOption = new NftQueryOptions();
      nftQueryOption.withTimestamp = true;
      const nfts = await nftService.getNftsForAddress(userAccount.address, {from: 0,size: 10}, {type: NftType.SemiFungibleESDT}, nftQueryOption);

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }

      for(const nft of nfts){
        expect(nft).toHaveStructure(Object.keys(new NftAccount()));
      }
    });
  });

  describe('Get NFT Count For Address', () => {
    it(`should return Nft count for address`, async () => {
      const count = await nftService.getNftCountForAddress(userAccount.address, {type: NftType.NonFungibleESDT});
      expect(typeof count).toBe('number');
    });
  });

  describe('Get GatewayNFT', () => {
    it(`should return a list with nfts`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421'];
      const nfts = await nftService.getGatewayNfts(nftAddress, nftFilter);

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }
      for(const nft of nfts){
        expect(nft).toHaveStructure(Object.keys(new GatewayNft()));
      }
    });

    it(`should return a list with nfts if identifiers value is 2`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421', 'LKMEX-aab910-1d8b28'];
      const nfts = await nftService.getGatewayNfts(nftAddress, nftFilter);

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }
      for(const nft of nfts){
        expect(nft).toHaveStructure(Object.keys(new GatewayNft()));
      }

    });
  });

  describe('Get NFTs For Address Internal', () => {
    it(`should return a list with nfts from internal address`, async () => {
      const nftFilter = new NftFilter();
      nftFilter.identifiers = ['LKFARM-9d1ea8-44b421'];
      const nfts = await nftService.getNftsForAddressInternal(nftAddress, nftFilter);

      if(!nfts){
        throw new Error('Nft properties are not defined');
      }
      for(const nft of nfts){
        expect(nft).toHaveStructure(Object.keys(new NftAccount()));
      }
    });
  });

  describe('Get Nft Supply', () => {
    it('should return nft supply', async () => {
     return expect(nftService.getNftSupply(nftsIdentifier)).resolves.toEqual(expect.any(String));
    });

    it('should return undefined if identifier is invalid', async () => {
      expect(await nftService.getNftSupply(invalidIdentifier)).toBeUndefined();
    });
  });

  describe('Get Nft For Address', () => {
    it('should return undefined if the address does not contain a specific identifier', async () => {
      expect(await nftService.getNftForAddress(nftAddress, 'LKMEX-aab910-21c8e1')).toBeUndefined();
    });
  });

  describe('Get Nft Owners', () => {
    it('should return nft owners', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', {from: 0, size: 1});

      if(!owners){
        throw new Error('Nft properties are not defined');
      }
      for(const owner of owners){
        expect(owner).toHaveStructure(Object.keys(new NftOwner()));
      }
    });

    it('nft owner has only 1 address', async () => {
      const owners = await nftService.getNftOwners('ALIEN-a499ab-0227', {from: 0, size: 1});

      if(!owners){
        throw new Error('Nft properties are not defined');
      }

      expect(owners.length).toBe(1);
    });
  });
});
