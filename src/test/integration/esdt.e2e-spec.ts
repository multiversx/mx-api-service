import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { EsdtService } from "../../endpoints/esdt/esdt.service";
import tokenExample from "../mocks/esdt/token/token.example";
import { TokenAddressRoles } from "src/endpoints/tokens/entities/token.address.roles";

describe('ESDT Service', () => {
  let esdtService: EsdtService;

  const egldMexTokenIdentifier: string = 'EGLDMEX-0be9e5';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtService = moduleRef.get<EsdtService>(EsdtService);

  }, Constants.oneHour() * 1000);

  describe('Get All Esdts For Address', () => {
    it('should return all esdts of address', async () => {
      const esdtAddress: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';

      await expect(esdtService.getAllEsdtsForAddress(esdtAddress))
        .resolves.toBeInstanceOf(Object);
    });
  });

  describe('Get All Esdts Tokens', () => {
    it('should return all esdts tokens', async () => {
      const tokens = await esdtService.getAllEsdtTokens();
      expect(tokens).toBeInstanceOf(Array);
    });
  });

  describe('Get All Esdts Token Raw', () => {
    it('should return all esdts token raw', async () => {
      const tokensRaw = await esdtService.getAllEsdtTokensRaw();
      for (const tokenRaw of tokensRaw) {
        expect(tokenRaw).toBeInstanceOf(Object);
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
