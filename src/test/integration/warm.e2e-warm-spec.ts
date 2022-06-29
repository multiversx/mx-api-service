
import { CachingService, Constants } from "@elrondnetwork/nestjs-microservice-common";
import { Test } from "@nestjs/testing";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import Initializer from "./e2e-init";

describe('Warm for tests', () => {
  let cachingService: CachingService;

  beforeAll(async () => {
    await Initializer.initialize();

    const module = await Test.createTestingModule({
      imports: [DynamicModuleUtils.getCachingModule()],
    }).compile();

    cachingService = module.get<CachingService>(CachingService);

  }, Constants.oneHour() * 1000);

  describe('Warm', () => {
    it('test for warm', async () => {
      const isInitialized =
        await cachingService.getCacheRemote<boolean>('isInitialized');

      expect(isInitialized).toBe(true);
    });
  });
});
