import { Test } from "@nestjs/testing";
import { EsdtService } from "../../endpoints/esdt/esdt.service";
import tokenExample from "../data/esdt/token/token.example";
import { TokenAddressRoles } from "src/endpoints/tokens/entities/token.address.roles";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { EsdtAddressService } from "src/endpoints/esdt/esdt.address.service";
import { EsdtDataSource } from "src/endpoints/esdt/entities/esdt.data.source";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import '../../utils/extensions/jest.extensions';
import { PublicAppModule } from "src/public.app.module";

describe('ESDT Service', () => {
  let esdtService: EsdtService;
  let esdtAddressService: EsdtAddressService;

  const egldMexTokenIdentifier: string = 'EGLDMEX-0be9e5';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtService = moduleRef.get<EsdtService>(EsdtService);
    esdtAddressService = moduleRef.get<EsdtAddressService>(EsdtAddressService);
  });

  describe('Get Esdts For Address', () => {
    it('gateway & elastic esdts of address should be the same', async () => {
      const esdtAddress: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';

      const gatewayNfts = await esdtAddressService.getEsdtsForAddress(esdtAddress, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.gateway);
      const elasticNfts = await esdtAddressService.getEsdtsForAddress(esdtAddress, new NftFilter(), { from: 0, size: 25 }, EsdtDataSource.elastic);

      expect(gatewayNfts).toStrictEqual(elasticNfts);
    });
  });

  describe('Get Esdt Collections For Address', () => {
    it('gateway esdt collections should have property canCreate & canBurn', async () => {
      const esdtAddress: string = 'erd1zqhn3w4w7uamw6eelrqcjjm8ac732s2z69hgkduldm6fapa90drswejs34';

      const gatewayNfts: NftCollectionAccount[] | NftCollection[] = await esdtAddressService.getEsdtCollectionsForAddress(esdtAddress, new CollectionFilter(), { from: 0, size: 25 }, EsdtDataSource.gateway);

      for (const gatewayNft of gatewayNfts) {
        expect(gatewayNft).toHaveProperty('canCreate');
        expect(gatewayNft).toHaveProperty('canBurn');
      }
    });
  });

  describe('Get Esdt Collections For Address', () => {
    it('elastic esdt collections should have property of NftCollection', async () => {
      const esdtAddress: string = 'erd1zqhn3w4w7uamw6eelrqcjjm8ac732s2z69hgkduldm6fapa90drswejs34';

      const gatewayNfts: NftCollectionAccount[] | NftCollection[] = await esdtAddressService.getEsdtCollectionsForAddress(esdtAddress, new CollectionFilter(), { from: 0, size: 25 }, EsdtDataSource.gateway);

      for (const gatewayNft of gatewayNfts) {
        expect(gatewayNft.hasOwnProperty('collection')).toBe(true);
        expect(gatewayNft.hasOwnProperty('type')).toBe(true);
        expect(gatewayNft.hasOwnProperty('name')).toBe(true);
        expect(gatewayNft.hasOwnProperty('ticker')).toBe(true);
        expect(gatewayNft.hasOwnProperty('canFreeze')).toBe(true);
        expect(gatewayNft.hasOwnProperty('canWipe')).toBe(true);
        expect(gatewayNft.hasOwnProperty('canPause')).toBe(true);
        expect(gatewayNft.hasOwnProperty('canTransferRole')).toBe(true);
        expect(gatewayNft.hasOwnProperty('assets')).toBe(true);
        expect(gatewayNft.hasOwnProperty('roles')).toBe(true);
      }
    });
  });

  describe('Get All Esdts Tokens', () => {
    it('should return all esdts tokens', async () => {
      const tokens = await esdtService.getAllEsdtTokens();

      if (!tokens) {
        throw new Error('Token properties are not defined');
      }

      for (const token of tokens) {
        expect(token).toBeInstanceOf(Object);
      }
    });
  });

  describe('Get Esdt Token Properties', () => {
    it('should be return token properties', async () => {
      const properties = await esdtService.getEsdtTokenProperties(tokenExample.identifier);
      if (!properties) {
        throw new Error('Properties not defined');
      }

      expect(properties.name).toEqual(tokenExample.name);
      expect(properties.decimals).toEqual(tokenExample.decimals);
      expect(properties.canUpgrade).toEqual(tokenExample.canUpgrade);
      expect(properties.canMint).toEqual(tokenExample.canMint);
      expect(properties.canBurn).toEqual(tokenExample.canBurn);
    });
  });

  describe('Get Token Supply', () => {
    it('should return esdt token supply', async () => {
      const supply = await esdtService.getTokenSupply(tokenExample.identifier);
      if (!supply) {
        throw new Error('Token supply must be defined');
      }

      expect(supply.totalSupply).toBeDefined();
      expect(supply.circulatingSupply).toBeDefined();
    });
  });

  describe('Get Esdt Token Properties Raw', () => {
    it('should return token properties', async () => {
      const properties = await esdtService.getEsdtTokenPropertiesRaw(tokenExample.identifier);
      expect(properties).toBeDefined();
    });
  });

  describe('Get Esdt Addresses Roles', () => {
    it('return addresses role', async () => {
      const roles = await esdtService.getEsdtAddressesRoles(egldMexTokenIdentifier);
      if (!roles) {
        throw new Error('Roles must be defined');
      }

      expect(roles).toBeInstanceOf(Array);

      for (const role of roles) {
        expect(role).toHaveStructure(Object.keys(new TokenAddressRoles()));
      }
    });
  });

  describe('Get Token Account Count', () => {
    it('return token account count', async () => {
      const count = await esdtService.getTokenAccountsCount(tokenExample.identifier);
      return expect(typeof count).toBe('number');
    });
  });

  describe('Get Esdt Addresses Roles Raw', () => {
    it('EGLDMEX token should have valid roles', async () => {
      const roles = await esdtService.getEsdtAddressesRolesRaw(egldMexTokenIdentifier);
      if (!roles) {
        throw new Error('Roles must be defined');
      }

      expect(roles).toBeInstanceOf(Array);

      for (const role of roles) {
        expect(role).toHaveStructure(Object.keys(new TokenAddressRoles()));
      }
    });

    it('Token example should have valid roles', async () => {
      const roles = await esdtService.getEsdtAddressesRolesRaw(tokenExample.identifier);
      if (!roles) {
        throw new Error('Roles must be defined');
      }

      expect(roles).toBeInstanceOf(Array);

      for (const role of roles) {
        expect(role).toHaveStructure(Object.keys(new TokenAddressRoles()));
      }
    });
  });
});
