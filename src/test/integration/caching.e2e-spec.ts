import { CachingService, Constants } from '@elrondnetwork/nestjs-microservice-common';
import { Test } from '@nestjs/testing';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';

describe('Caching Service', () => {
  let cachingService: CachingService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ApiConfigModule,
        DynamicModuleUtils.getCachingModule(),
      ],
    }).compile();

    cachingService = moduleRef.get<CachingService>(CachingService);
  });

  describe('Cache Local', () => {
    //CRUD
    it(`should return undefined, 'test' key isn't set`, async () => {
      const cacheValue = await cachingService.getCacheLocal('test');
      expect(cacheValue).toBeUndefined();
    });

    it(`should return 'test' value after key is set`, async () => {
      await cachingService.setCacheLocal('test', 'test', Constants.oneSecond());

      const cacheValue = await cachingService.getCacheLocal('test');
      expect(cacheValue).toBe('test');
    });

    it(`should return 'test-update' value after key is set`, async () => {
      await cachingService.setCacheLocal('test', 'test-update', Constants.oneSecond());

      const cacheValue = await cachingService.getCacheLocal('test');
      expect(cacheValue).toBe('test-update');
    });

    it(`should return undefined because key is invalidated`, async () => {
      await cachingService.deleteInCache('test');

      const cacheValue = await cachingService.getCacheLocal('test');
      expect(cacheValue).toBeUndefined();
    });

  });

  describe('Get Or Set Cache', () => {
    it(`should return 'test' value after key is set`, async () => {
      // eslint-disable-next-line require-await
      const cacheValue = await cachingService.getOrSetCache('test', async () => 'test', Constants.oneSecond());
      expect(cacheValue).toBe('test');
    });
  });

  describe('Batch process in chunks', () => {
    const input: Array<Number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const output: Array<String> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
    const emptyOutput: Array<any> = Array(15).fill(null);
    const cacheKeyFunction = (number: Number) => number.toString();
    const handlerFunction = async (number: Number) => await number.toString();

    it(`should return emptyOutput because keys aren't set`, async () => {
      const cacheValueChunks = await cachingService.batchGetCacheRemote(input.map((x) => cacheKeyFunction(x)));

      expect(cacheValueChunks).toStrictEqual(emptyOutput);
    });

    it(`should return ouput keys as string`, async () => {
      await cachingService.batchProcess(input, cacheKeyFunction, handlerFunction, Constants.oneSecond());

      const cacheValueChunks = await cachingService.batchGetCacheRemote(input.map((x) => cacheKeyFunction(x)));
      expect(cacheValueChunks).toStrictEqual(output);
    });

  });

});
