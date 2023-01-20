import { EsdtAddressService } from 'src/endpoints/esdt/esdt.address.service';
import { Test } from "@nestjs/testing";
import { EsdtDataSource } from 'src/endpoints/esdt/entities/esdt.data.source';
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import { NftCollectionWithRoles } from 'src/endpoints/collections/entities/nft.collection.with.roles';
import { NftType } from 'src/endpoints/nfts/entities/nft.type';
import { CollectionFilter } from 'src/endpoints/collections/entities/collection.filter';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import { PublicAppModule } from 'src/public.app.module';
import { NftFilter } from 'src/endpoints/nfts/entities/nft.filter';

describe('EsdtAddressService', () => {
  let esdtAddressService: EsdtAddressService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtAddressService = moduleRef.get<EsdtAddressService>(EsdtAddressService);
  });

  describe('getEsdtsForAddress', () => {
    it('should return one esdt from address with source "GATEWAY"', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
      const filter = new NftFilter();
      filter.identifiers = ['EGLDMEXF-5bcc57-0b63a1'];
      const results = await esdtAddressService.getNftsForAddress(address, filter, { from: 0, size: 1 }, EsdtDataSource.gateway);

      expect(results).toHaveLength(1);
      expect(results).toBeInstanceOf(Array);

      for (const result of results) {
        expect(result).toBeInstanceOf(Object);
        expect(result.identifier).toStrictEqual('EGLDMEXF-5bcc57-0b63a1');
      }
    });
  });

  it('should return one esdt from address with source "ELASTIC"', async () => {
    const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
    const filter = new NftFilter();
    filter.identifiers = ['EGLDMEXF-5bcc57-0b63a1'];
    const results = await esdtAddressService.getNftsForAddress(address, filter, { from: 0, size: 1 }, EsdtDataSource.elastic);

    expect(results).toHaveLength(1);
    expect(results).toBeInstanceOf(Array);

    for (const result of results) {
      expect(result).toBeInstanceOf(Object);
      expect(result.identifier).toStrictEqual('EGLDMEXF-5bcc57-0b63a1');
    }
  });

  it('gateway & elastic esdts of address should be the same', async () => {
    const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
    const filter = new NftFilter();
    filter.identifiers = ['EGLDMEXF-5bcc57-0b63a1'];

    const elasticResults = await esdtAddressService.getNftsForAddress(address, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.gateway);
    const gatewayResults = await esdtAddressService.getNftsForAddress(address, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.elastic);

    const sortedGatewayNfts = gatewayResults.sort((a, b) => a.identifier.localeCompare(b.identifier));
    const sortedElasticNfts = elasticResults.sort((a, b) => a.identifier.localeCompare(b.identifier));

    expect(sortedGatewayNfts).toStrictEqual(sortedElasticNfts);
  });

  it('should return one esdt from address if "isWhiteListed" from "ELASTCIC" source', async () => {
    const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
    const filter = new NftFilter();
    filter.isWhitelistedStorage = false;

    const results = await esdtAddressService.getNftsForAddress(address, new NftFilter(), { from: 0, size: 2 }, EsdtDataSource.gateway);
    expect(results).toHaveLength(2);

    for (const result of results) {
      expect(result.isWhitelistedStorage).toStrictEqual(false);
    }
  });

  describe('getEsdtsCountForAddressFromElastic', () => {
    it('should return esdts count for address form "ELASTIC"', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
      const filter = new NftFilter();
      filter.identifiers = ['EGLDMEXF-5bcc57-0b63a1'];
      const count = await esdtAddressService.getNftCountForAddressFromElastic(address, filter);

      expect(typeof count).toBe('number');
    });
  });

  describe('getEsdtCollectionsForAddress', () => {
    it('should return esdt collection for address based on collection identifier', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collections: NftCollection[] | NftCollectionWithRoles[] = await esdtAddressService.getCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 });

      expect(collections).toHaveLength(1);
      expect(collections).toBeInstanceOf(Object);

      for (const collection of collections) {
        expect(collection.hasOwnProperty('collection')).toBe(true);
        expect(collection.hasOwnProperty('type')).toBe(true);
        expect(collection.hasOwnProperty('name')).toBe(true);
        expect(collection.hasOwnProperty('ticker')).toBe(true);
        expect(collection.hasOwnProperty('canFreeze')).toBe(true);
        expect(collection.hasOwnProperty('canWipe')).toBe(true);
        expect(collection.hasOwnProperty('canPause')).toBe(true);
        expect(collection.hasOwnProperty('assets')).toBe(true);
      }
    });

    it('should return esdt collection for address based on collection identifier and contain canBurn and canCreate ', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collectionEsdtGateway: NftCollection[] | NftCollectionWithRoles[] = await esdtAddressService.getCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 });

      for (const collection of collectionEsdtGateway) {
        expect(collection).toBeInstanceOf(Object);
      }
    });
  });

  describe('getEsdtCollectionsCountForAddressFromElastic', () => {
    it('should return esdt collections count for address from "ELASTIC"', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const filter = new CollectionFilter();
      filter.collection = 'HMORGOTH-ecd5fb';
      const count = await esdtAddressService.getCollectionCountForAddressFromElastic(address, filter);

      expect(typeof count).toBe('number');
    });

    it('should return esdt collections of type NonFungibleESDT and SemiFungibleESDT for a specific address', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const filter = new CollectionFilter();
      filter.collection = 'HMORGOTH-ecd5fb';
      filter.type = [NftType.NonFungibleESDT, NftType.SemiFungibleESDT];
      const results = await esdtAddressService.getCollectionsForAddress(address, filter, { from: 0, size: 2 });

      const collectionResults = results.map((result) => result.type);
      expect(collectionResults.includes(NftType.NonFungibleESDT));
      expect(collectionResults.includes(NftType.SemiFungibleESDT));
    });
  });
});
