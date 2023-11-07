import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { IndexerService } from "src/common/indexer/indexer.service";
import { Tag } from "src/endpoints/nfttags/entities/tag";
import { TagService } from "src/endpoints/nfttags/tag.service";
import { CacheInfo } from "src/utils/cache.info";

describe('TagService', () => {
  let tagService: TagService;
  let indexerService: IndexerService;
  let cachingService: CacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: IndexerService,
          useValue: {
            getNftTagCount: jest.fn(),
            getNftTags: jest.fn(),
            getTag: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    tagService = moduleRef.get<TagService>(TagService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    cachingService = moduleRef.get<CacheService>(CacheService);
  });

  describe('getNftTagCount', () => {
    it('should call getNftTagCount with search parameter', async () => {
      const search = 'test';

      await tagService.getNftTagCount(search);

      expect(indexerService.getNftTagCount).toHaveBeenCalledWith(search);
    });

    it('should return cached NftTagCount when search parameter is not provided', async () => {
      const cachedValue = 100;
      // eslint-disable-next-line require-await
      jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async () => cachedValue);

      const result = await tagService.getNftTagCount();

      expect(cachingService.getOrSet).toHaveBeenCalledWith(CacheInfo.NftTagCount.key, expect.any(Function), CacheInfo.NftTagCount.ttl);
      expect(indexerService.getNftTagCount).not.toHaveBeenCalled();
      expect(result).toBe(cachedValue);
    });

    it('should call getNftTagCountRaw and cache the result when search parameter is not provided', async () => {
      const expectedResult = 50;
      jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
        const result = await promise();
        expect(result).toBe(expectedResult);
        return result;
      });

      jest.spyOn(indexerService, 'getNftTagCount').mockResolvedValueOnce(expectedResult);

      const result = await tagService.getNftTagCount();

      expect(cachingService.getOrSet).toHaveBeenCalledWith(CacheInfo.NftTagCount.key, expect.any(Function), CacheInfo.NftTagCount.ttl);
      expect(indexerService.getNftTagCount).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('getNftTags', () => {
    describe('when search parameter is not provided', () => {
      it('should call getNftTagsRaw and cache the result', async () => {
        const expectedResult: Tag[] = [{ tag: 'multiversx', count: 100 }];
        const pagination: QueryPagination = { size: 0, from: 2 };

        jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
          const result = await promise();
          expect(result).toEqual(expectedResult);
          return result;
        });

        jest.spyOn(indexerService, 'getNftTags').mockResolvedValueOnce([{ tag: 'multiversx', count: 100 }]);

        const result = await tagService.getNftTags(pagination);
        expect(indexerService.getNftTags).toHaveBeenCalledWith(pagination, undefined);
        expect(result).toEqual(expectedResult);
      });

      it('should return cached NftTags when cache is available', async () => {
        const cachedValue: Tag[] = [new Tag(), new Tag()];
        const pagination: QueryPagination = { size: 0, from: 2 };

        // eslint-disable-next-line require-await
        jest.spyOn(cachingService, 'getOrSet').mockImplementationOnce(async () => cachedValue);

        const result = await tagService.getNftTags(pagination);

        expect(indexerService.getNftTags).not.toHaveBeenCalled();
        expect(result).toEqual(cachedValue);
      });
    });

    describe('when search parameter is provided', () => {
      it('should call getNftTagsRaw', async () => {
        const expectedResult: Tag[] = [new Tag(), new Tag()];
        const pagination: QueryPagination = { size: 0, from: 2 };
        const search = 'sunny';

        jest.spyOn(tagService, 'getNftTagsRaw').mockResolvedValueOnce(expectedResult);

        const result = await tagService.getNftTags(pagination, search);
        expect(tagService.getNftTagsRaw).toHaveBeenCalledWith(pagination, search);
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('getNftTag()', () => {
    it('should return nft details and verify if getTag from indexer was called', async () => {
      const tag = 'sunny';
      const indexerResult = {
        tag: 'sunny',
        count: 1234,
      };
      const expectedResult = new Tag();
      expectedResult.tag = indexerResult.tag;
      expectedResult.count = indexerResult.count;

      jest.spyOn(indexerService, 'getTag').mockResolvedValueOnce(indexerResult);

      const result = await tagService.getNftTag(tag);
      expect(indexerService.getTag).toHaveBeenCalledWith(tag);
      expect(result).toEqual(expectedResult);
    });
  });
});
