import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { CachingService } from '../helpers/caching.service';

describe('Caching Service', () => {
  let cachingService: CachingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [PublicAppModule],
      }).compile();

    cachingService = moduleRef.get<CachingService>(CachingService);
  });

  describe('Cache Local', () => {
    it(`shuld return undefined, 'test' key isn't set`, async () => {
      expect(await cachingService.getCacheLocal('test')).toBeUndefined();
    });

    it(`should return 'test' value after key is set`, async () => {
      await cachingService.setCacheLocal('test', 'test', 1);

      expect(await cachingService.getCacheLocal('test')).toBe('test');
    })
  });

  describe('Get Or Set Cache', () => {
    it(`should return 'test' value after key is set`, async () => {
      expect(await cachingService.getOrSetCache(
        'test',
        async () => 'test',
        1,
      )).toBe('test');
    })
  });

  describe('Batch process in chunks', () => {
    let input: Array<Number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    let output: Array<String> = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];
    let emptyOutput: Array<any> = Array(15).fill(null);
    let cacheKeyFunction = (number: Number) => number.toString();
    let handlerFunction = async(number: Number) => await number.toString();

    it(`should return emptyOutput because keys aren't set`, async () => {
      expect(await cachingService.batchGetCache(input.map((x) => cacheKeyFunction(x)))).toStrictEqual(emptyOutput);
    })

    it(`should return ouput keys as string`, async () => {
      await cachingService.batchProcess(input, cacheKeyFunction, handlerFunction, 1);
      expect(await cachingService.batchGetCache(input.map((x) => cacheKeyFunction(x)))).toStrictEqual(output);
    })
  });

  describe('Delete caching for keys', () => {
    it(`should return 'test-del' because key is set`, async() => {
      expect(await cachingService.getOrSetCache('test-del', async () => 'test-del', 1)).toBe('test-del');
    })

    it(`should return undefined because key is invalidated`, async() => {
      await cachingService.deleteInCache('test-del');

      expect(await cachingService.getCache('test-del')).toBeNull();
    })
  })
});