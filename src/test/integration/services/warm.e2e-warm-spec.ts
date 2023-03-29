
import { ElrondCachingService, Constants } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import Initializer from "./e2e-init";

describe('Warm for tests', () => {
  let cachingService: ElrondCachingService;

  beforeAll(async () => {
    await Initializer.initialize();

    const module = await Test.createTestingModule({
      imports: [
        ApiConfigModule,
        DynamicModuleUtils.getCachingModule(),
      ],
    }).compile();

    cachingService = module.get<ElrondCachingService>(ElrondCachingService);

  }, Constants.oneHour() * 1000);

  describe('Warm', () => {
    it('test for warm', async () => {
      const isInitialized =
        await cachingService.getRemote<boolean>('isInitialized');

      expect(isInitialized).toBe(true);
    });
  });
});
