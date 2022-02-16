import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { TokenAssetService } from "../../endpoints/tokens/token.asset.service";

describe('Token Service', () => {
  let tokenAssetService: TokenAssetService;

  beforeAll(async () => {

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenAssetService = moduleRef.get<TokenAssetService>(TokenAssetService);

  });

  describe('Get All Assets', () => {
    it(`should return all assets`, async () => {
      const assets = await tokenAssetService.getAllAssets();

      const assetValues = Object.values(assets);

      assetValues.forEach(asset => {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      });
    });
  });

  describe('Get All Assets Raw', () => {
    it('should return all assets raw', async () => {
      const assets = await tokenAssetService.getAllAssetsRaw();

      const assetValues = Object.values(assets);

      assetValues.forEach(asset => {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      });
    });
  });
});
