import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { TestingModule, Test } from "@nestjs/testing";
import { PubSubListenerController } from "src/common/pubsub/pub.sub.listener.controller";

const cacheServiceMock = {
  deleteLocal: jest.fn(),
  refreshLocal: jest.fn(),
};

describe('PubSubListenerController', () => {
  let controller: PubSubListenerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PubSubListenerController],
      providers: [
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    controller = module.get<PubSubListenerController>(PubSubListenerController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delete cache keys', async () => {
    const keys = ['key1', 'key2', 'key3'];

    await controller.deleteCacheKey(keys);

    expect(cacheServiceMock.deleteLocal).toHaveBeenCalledTimes(keys.length);

    let index = 1;
    for (const key of keys) {
      expect(cacheServiceMock.deleteLocal).toHaveBeenNthCalledWith(index, key);
      index++;
    }
  });

  it('should refresh cache key', async () => {
    const info = { key: 'test-key', ttl: 1000 };

    await controller.refreshCacheKey(info);

    expect(cacheServiceMock.refreshLocal).toHaveBeenCalledWith(info.key, info.ttl);
  });
});
