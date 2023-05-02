
import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import Initializer from "./e2e-init";

describe('Warm for tests', () => {
  let cachingService: CacheService;

  beforeAll(async () => {
    await Initializer.initialize();

    const module = await Test.createTestingModule({
      imports: [
        ApiConfigModule,
        DynamicModuleUtils.getCacheModule(),
      ],
    }).compile();

    cachingService = module.get<CacheService>(CacheService);

  }, Constants.oneHour() * 1000);

  describe('Warm', () => {
    it('test for warm', async () => {
      const isInitialized =
        await cachingService.getRemote<boolean>('isInitialized');

      expect(isInitialized).toBe(true);
    });
  });
});
