import { CollectionAccountFilter } from '../../endpoints/collections/entities/collection.account.filter';
import { NftFilter } from '../../endpoints/nfts/entities/nft.filter';
import { EsdtAddressService } from 'src/endpoints/esdt/esdt.address.service';
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";
import { EsdtDataSource } from 'src/endpoints/esdt/entities/esdt.data.source';
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import { NftCollectionAccount } from 'src/endpoints/collections/entities/nft.collection.account';

describe('EsdtAddressService', () => {
  let esdtAddressService: EsdtAddressService;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtAddressService = moduleRef.get<EsdtAddressService>(EsdtAddressService);
  }, Constants.oneHour() * 1000);

  describe('getEsdtsForAddress', () => {
    it('should return one esdt from address with source "GATEWAY"', async () => {
      const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
      const filter = new NftFilter();
      filter.identifiers = ['EGLDMEXF-5bcc57-0b63a1'];
      const results = await esdtAddressService.getEsdtsForAddress(address, filter, { from: 0, size: 1 }, EsdtDataSource.gateway);

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
    const results = await esdtAddressService.getEsdtsForAddress(address, filter, { from: 0, size: 1 }, EsdtDataSource.elastic);

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

    const elasticResults = await esdtAddressService.getEsdtsForAddress(address, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.gateway);
    const gatewayResults = await esdtAddressService.getEsdtsForAddress(address, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.elastic);

    expect(elasticResults).toStrictEqual(gatewayResults);
  });

  it('should return one esdt from address if "isWhiteListed" from "ELASTCIC" source', async () => {
    const address: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
    const filter = new NftFilter();
    filter.isWhitelistedStorage = false;

    const results = await esdtAddressService.getEsdtsForAddress(address, new NftFilter(), { from: 0, size: 2 }, EsdtDataSource.gateway);
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
      const count = await esdtAddressService.getEsdtsCountForAddressFromElastic(address, filter);

      expect(typeof count).toBe('number');
    });
  });

  describe('getEsdtCollectionsForAddress', () => {
    it('should return esdt collection for address based on collection identifier ', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collections: NftCollection[] | NftCollectionAccount[] = await esdtAddressService.getEsdtCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 });

      expect(collections).toHaveLength(1);

      for (const collection of collections) {
        expect(collection.hasOwnProperty('collection')).toBe(true);
        expect(collection.hasOwnProperty('name')).toBe(true);
        expect(collection.hasOwnProperty('canCreate')).toBe(true);
        expect(collection.hasOwnProperty('canBurn')).toBe(true);
      }
    });

    it('should return esdt collection for address based on collection identifier and source "ELASTIC" ', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collections: NftCollection[] | NftCollectionAccount[] = await esdtAddressService.getEsdtCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 }, EsdtDataSource.elastic);

      expect(collections).toHaveLength(1);

      for (const collection of collections) {
        expect(collection.hasOwnProperty('collection')).toBe(true);
        expect(collection.hasOwnProperty('name')).toBe(true);
        expect(collection.hasOwnProperty('canCreate')).toBe(true);
        expect(collection.hasOwnProperty('canBurn')).toBe(true);
      }
    });

    it('should return esdt collection for address based on collection identifier and source "GATEWAY" ', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collections: NftCollection[] | NftCollectionAccount[] = await esdtAddressService.getEsdtCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 }, EsdtDataSource.gateway);

      expect(collections).toHaveLength(1);

      for (const collection of collections) {
        expect(collection.hasOwnProperty('collection')).toBe(true);
        expect(collection.hasOwnProperty('name')).toBe(true);
        expect(collection.hasOwnProperty('canCreate')).toBe(true);
        expect(collection.hasOwnProperty('canBurn')).toBe(true);
      }
    });

    it('should return esdt collection for address based on collection identifier and both response from elastic and gateway source must to be the same ', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const collectionFilter = new CollectionAccountFilter();
      collectionFilter.collection = 'HMORGOTH-ecd5fb';

      const collectionEsdtElastic: NftCollection[] | NftCollectionAccount[] = await esdtAddressService.getEsdtCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 }, EsdtDataSource.elastic);
      const collectionEsdtGateway: NftCollection[] | NftCollectionAccount[] = await esdtAddressService.getEsdtCollectionsForAddress(address, collectionFilter, { from: 0, size: 1 }, EsdtDataSource.gateway);

      expect(collectionEsdtElastic).toStrictEqual(collectionEsdtGateway);
    });
  });

  describe('getEsdtCollectionsCountForAddressFromElastic', () => {
    it('should return esdt collections count for address form "ELASTIC"', async () => {
      const address: string = 'erd1yt24jpcm58k2734lf53ws96lqtkzy46vlxwnjud7ce3vl02eahmsele6j8';
      const filter = new NftFilter();
      filter.collection = 'HMORGOTH-ecd5fb';
      const count = await esdtAddressService.getEsdtCollectionsCountForAddressFromElastic(address, filter);

      expect(typeof count).toBe('number');
    });
  });
});
