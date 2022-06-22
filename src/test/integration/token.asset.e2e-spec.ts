import { Test } from "@nestjs/testing";
import { AssetsService } from "../../common/assets/assets.service";
import { PublicAppModule } from "src/public.app.module";

describe('Token Service', () => {
  let assetsService: AssetsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    assetsService = moduleRef.get<AssetsService>(AssetsService);
  });

  describe('Get All Assets', () => {
    it(`should return all assets`, async () => {
      const assets = await assetsService.getAllTokenAssets();
      const assetValues = Object.values(assets);

      for (const asset of assetValues) {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      }
    });
  });

  describe('Get All Assets Raw', () => {
    it('should return all assets raw', async () => {
      const assets = await assetsService.getAllTokenAssetsRaw();
      const assetValues = Object.values(assets);

      for (const asset of assetValues) {
        expect(asset).toHaveProperty('website');
        expect(asset).toHaveProperty('description');
        expect(asset).toHaveProperty('status');
        expect(asset).toHaveProperty('pngUrl');
        expect(asset).toHaveProperty('svgUrl');
      }
    });
  });
});
