
import { CachingModule, CachingService, Constants } from "@elrondnetwork/nestjs-microservice-common";
import { Test } from "@nestjs/testing";
import Initializer from "./e2e-init";

describe('Warm for tests', () => {
  let cachingService: CachingService;

  beforeAll(async () => {
    await Initializer.initialize();

    const module = await Test.createTestingModule({
      imports: [CachingModule],
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
