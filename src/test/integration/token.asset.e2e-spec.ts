import Initializer from "./e2e-init";
import {Test} from "@nestjs/testing";
import {PublicAppModule} from "../../public.app.module";
import {Constants} from "../../utils/constants";
import {TokenAssetService} from "../../endpoints/tokens/token.asset.service";

describe('Token Service', () => {
  let tokenAssetService: TokenAssetService;

  const identifier: string = 'EGLDRIDE-7bd51a';

  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenAssetService = moduleRef.get<TokenAssetService>(TokenAssetService);

  }, Constants.oneHour() * 1000);

  describe('Get All Assets', () => {
    it(`should return all assets`, async () => {
      const assets = await tokenAssetService.getAllAssets();
      expect(assets).toBeInstanceOf(Object);
    });
  });

  describe('Get Assets', () => {
    it(`should return tokenIdentifier assets`, async () => {
      const assets = await tokenAssetService.getAssets(identifier);
      expect(assets).toBeInstanceOf(Object);
    });
    it(`asset contain property of TokenAssets`, async () => {
      const assets = await tokenAssetService.getAssets(identifier);
      expect(assets).toHaveProperty('website');
      expect(assets).toHaveProperty('description');
      expect(assets).toHaveProperty('status');
    });
    it(`asset property "website" to be equal with "maiar.exchange"`, async () => {
      const assets = await tokenAssetService.getAssets(identifier);
      expect(assets?.website).toEqual('https://maiar.exchange');
    });
  });

  describe('Get All Assets Raw', () => {
    it('should return all assets raw', async () => {
      const assets = await tokenAssetService.getAllAssetsRaw();
      expect(assets).toBeInstanceOf(Object);
    });
  });

  describe('Get All Assets Raw', () => {
    it('should return all assets raw', async () => {
      const assets = await tokenAssetService.getAllAssetsRaw();
      expect(assets).toBeInstanceOf(Object);
    });
  });
});
