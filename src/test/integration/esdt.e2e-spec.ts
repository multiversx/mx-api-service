import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {EsdtService} from "../../endpoints/esdt/esdt.service";
import {TokenAddressRoles} from "../../endpoints/tokens/entities/token.address.roles";

describe('ESDT Service', () => {
  let esdtService: EsdtService;

  const tokenIdentifier = 'QWT-46ac01';
  const addressToken = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtService = moduleRef.get<EsdtService>(EsdtService);

  }, Constants.oneHour() * 1000);

  describe('Get All Esdts For Address From Gateway', () => {
    it('should return all esdts for address from gateway', async() => {
      const returnEsdtsAddress = await esdtService.getAllEsdtsForAddress(addressToken);
      expect(returnEsdtsAddress).toBeInstanceOf(Object);
    });
  });

  describe('Get All Esdts Tokens', () => {
    it('should return all esdts tokens', async() => {
      const returnEsdtToken = await esdtService.getAllEsdtTokens();

      for (const esdt of returnEsdtToken) {
        expect(esdt).toBeInstanceOf(Object);
      }
    });
    it('all esdt need to contain properties', async() => {
      const returnEsdtToken = await esdtService.getAllEsdtTokens();

      for (const esdt of returnEsdtToken) {
        expect(esdt).toHaveProperty('canUpgrade');
        expect(esdt).toHaveProperty('canMint');
        expect(esdt).toHaveProperty('canBurn');
      }
    });
  });

  describe('Get All Esdts Token Raw', () => {
    it('should return all esdts token raw', async() => {
      const returnEsdtsRaw = await esdtService.getAllEsdtTokensRaw();

        for (const esdt of returnEsdtsRaw) {
          expect(esdt).toBeInstanceOf(Object);
        }
    });
    it('all esdts need to contain properties', async() => {
      const returnEsdtsRaw = await esdtService.getAllEsdtTokensRaw();

      for (const esdt of returnEsdtsRaw) {
        expect(esdt).toHaveProperty('canUpgrade');
        expect(esdt).toHaveProperty('canMint');
        expect(esdt).toHaveProperty('canBurn');
      }
    });
  });

  describe('Get Esdt Token Assets Raw', () => {
    it('should return undefined', async() => {
      const returnEsdtsAssets = await esdtService.getEsdtTokenAssetsRaw('undefinedEsdt');
      expect(returnEsdtsAssets).toBeUndefined();
    });
  });

  describe('Get Esdt Token Properties', () => {
    it('should return undefined', async() => {
      const returnTokenProperties = await esdtService.getEsdtTokenProperties(tokenIdentifier + 'e');
      expect(returnTokenProperties).toBeUndefined();
    });
    it('should return token properties', async() => {
      const returnTokenProperties = await esdtService.getEsdtTokenProperties(tokenIdentifier);
      expect(returnTokenProperties).toHaveProperty('canBurn');
      expect(returnTokenProperties).toHaveProperty('canFreeze');
      expect(returnTokenProperties).toHaveProperty('canWipe');
    });
  });

  describe('Get Token Supply', () => {
    it('should return esdt token properties', async() => {
      const returnTokenProperties: Number = new Number(await esdtService.getTokenSupply('LKMEX-aab910-10c47f'));
      expect(returnTokenProperties).toBeInstanceOf(Number);
    });
  });

  describe('Get Esdt Token Properties Raw', () => {
    it('should return undefined', async() => {
      const returnTokenPropertiesRaw = await esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier + 'e');
      expect(returnTokenPropertiesRaw).toBeNull();
    });
    it('should return token properties', async() => {
      const returnTokenPropertiesRaw = await esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier);
      expect(returnTokenPropertiesRaw).toHaveProperty('canBurn');
      expect(returnTokenPropertiesRaw).toHaveProperty('canFreeze');
      expect(returnTokenPropertiesRaw).toHaveProperty('canWipe');
    });
  });

  describe('Get Esdt Addresses Roles', () => {
    it('return addresses role', async () => {
      const returnRoles = await esdtService.getEsdtAddressesRoles(tokenIdentifier);
      expect(returnRoles).toBeInstanceOf(Array);
    });

    it('all tokens contains address and roles', async () => {
      const returnRoles = await esdtService.getEsdtAddressesRoles(tokenIdentifier);
      expect(returnRoles).toHaveStructure(Object.keys(TokenAddressRoles));
    });
  });

  describe('Get Esdt Addresses Roles Raw', () => {
    it('return addresses roles raw', async () => {
      const returnRolesRaw = await esdtService.getEsdtAddressesRolesRaw(tokenIdentifier);
      expect(returnRolesRaw).toBeInstanceOf(Array);
    });
    it('all tokens contains address and roles', async () => {
      const returnRolesRaw = await esdtService.getEsdtAddressesRolesRaw(tokenIdentifier);
      expect(returnRolesRaw).toHaveStructure(Object.keys(TokenAddressRoles));
    });
  });
});