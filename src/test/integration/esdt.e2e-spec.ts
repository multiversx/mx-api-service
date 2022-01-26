import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { EsdtService } from "../../endpoints/esdt/esdt.service";

describe('ESDT Service', () => {
  let esdtService: EsdtService;

  const tokenIdentifier: string = 'QWT-46ac01';
  const tokenAssetsIdentifier: string = 'EGLDMEX-0be9e5';
  const tokenRole: string = 'EGLDMEX-0be9e5';
  const smartContractAddress: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';


  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    esdtService = moduleRef.get<EsdtService>(EsdtService);

  }, Constants.oneHour() * 1000);

  describe('Get All Esdts For Address', () => {
    it('should return all esdts of address', async () => {
      return expect(esdtService.getAllEsdtsForAddress(smartContractAddress)).resolves.toBeInstanceOf(Object);
    });
  });

  describe('Get All Esdts Tokens', () => {
    it('should return all esdts tokens', async () => {
      const tokens = await esdtService.getAllEsdtTokens();

      for (const token of tokens) {
        expect(token).toBeInstanceOf(Object);
      }
    });
    it('all esdt need to contain properties', async () => {
      const tokens = await esdtService.getAllEsdtTokens();

      for (const token of tokens) {
        expect(token).toHaveProperty('canUpgrade');
        expect(token).toHaveProperty('canMint');
        expect(token).toHaveProperty('canBurn');
      }
    });
    it('should return all esdts tokens', async () => {
       return expect(esdtService.getAllEsdtTokens()).resolves.toBeInstanceOf(Object);
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
      return expect(esdtService.getEsdtTokenProperties(tokenAssetsIdentifier)).resolves.toBeInstanceOf(Object);
    });

    it('should return token properties', async () => {
      const tokenProperties = await esdtService.getEsdtTokenProperties(tokenIdentifier);
      expect(tokenProperties).toHaveProperty('canBurn');
      expect(tokenProperties).toHaveProperty('canFreeze');
      expect(tokenProperties).toHaveProperty('canWipe');
    });
  });

  describe('Get Token Supply', () => {
    it('should return esdt token supply', async () => {
      const supply = await esdtService.getTokenSupply(tokenIdentifier);
      expect(typeof supply?.totalSupply).toBe('string');
      expect(typeof supply?.circulatingSupply).toBe('string');
      expect(supply).toBeInstanceOf(Object);
    });
  });

  describe('Get Esdt Token Properties Raw', () => {
    it('should return token properties', async () => {
      return expect(esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier)).resolves.toBeInstanceOf(Object);
    });

    it('token should have canBurn, canFreeze and canWipe properties', async () => {
      const tokenProperties = await esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier);
      expect(tokenProperties).toHaveProperty('canBurn');
      expect(tokenProperties).toHaveProperty('canFreeze');
      expect(tokenProperties).toHaveProperty('canWipe');
    });
  });

  describe('Get Esdt Addresses Roles', () => {
    it('return addresses role', async () => {
      return expect(esdtService.getEsdtAddressesRoles(tokenRole)).resolves.toBeInstanceOf(Array);
    });
  });

  describe('Get Esdt Addresses Roles Raw', () => {
    it('return addresses roles raw', async () => {
      return expect(esdtService.getEsdtAddressesRolesRaw(tokenRole)).resolves.toBeInstanceOf(Array);
    });
    it('all tokens contains address and roles', async () => {
      const rolesRaw = await esdtService.getEsdtAddressesRolesRaw(tokenIdentifier);
      expect(rolesRaw).toEqual([]);
    });
  });
});