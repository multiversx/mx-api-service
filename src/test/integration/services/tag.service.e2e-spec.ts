import { CachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Tag } from "src/common/indexer/entities/tag";
import { IndexerService } from "src/common/indexer/indexer.service";
import { TagService } from "src/endpoints/nfttags/tag.service";
import { RootTestModule } from "src/test/root-test.module";

describe('Tag Service', () => {
  let service: TagService;
  let indexerService: IndexerService;
  let cachingService: CachingService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootTestModule],
      providers: [TagService],
    }).compile();

    service = moduleRef.get<TagService>(TagService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    cachingService = moduleRef.get<CachingService>(CachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNFtTags', () => {
    it('should call getNftTagsRaw method if search is provided', async () => {
      const search: string = 'test';
      jest.spyOn(service['indexerService'], 'getNftTags').mockResolvedValueOnce([]);

      await service.getNftTags(new QueryPagination({}), search);

      expect(indexerService.getNftTags).toHaveBeenCalledWith(new QueryPagination(), search);
    });

    it('should call getOrSetCache method if search is not provided', async () => {
      // eslint-disable-next-line require-await
      jest.spyOn(service['cachingService'], 'getOrSetCache').mockImplementationOnce(async () => [{
        tag: 'multiversx',
        count: 100,
      }]);

      const result = await service.getNftTags(new QueryPagination());
      expect(cachingService.getOrSetCache).toHaveBeenCalled();
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          tag: 'multiversx',
          count: 100,
        }),
      ]));
    });
  });

  describe('getNftTagCount', () => {
    it('returns the correct NFT tag count when called without search query', async () => {
      const expectedTagCount = 1234;
      jest.spyOn(service['indexerService'], 'getNftTagCount').mockResolvedValue(expectedTagCount);

      const actualTagCount = await service.getNftTagCount();
      expect(actualTagCount).toStrictEqual(expectedTagCount);
    });

    it('returns the correct NFT tag count when called with search query', async () => {
      const searchQuery = 'mySearchQuery';
      const expectedTagCount = 5678;
      jest.spyOn(service['indexerService'], 'getNftTagCount').mockResolvedValue(expectedTagCount);

      const actualTagCount = await service.getNftTagCount(searchQuery);
      expect(actualTagCount).toStrictEqual(expectedTagCount);
    });

    it('caches the NFT tag count when called without search query', async () => {
      const expectedTagCount = 1234;
      jest.spyOn(service['indexerService'], 'getNftTagCount').mockResolvedValue(expectedTagCount);
      const cachingServiceSpy = jest.spyOn(cachingService, 'getOrSetCache');

      const actualTagCount = await service.getNftTagCount();
      expect(actualTagCount).toEqual(expectedTagCount);
      expect(cachingServiceSpy).toHaveBeenCalled();
    });
  });

  describe('getNftTag', () => {
    it('should return a Tag object with the specified tag name and count', async () => {
      const tag: Tag = {
        tag: 'multiversx',
        count: 100,
      };

      jest.spyOn(service['indexerService'], 'getTag').mockReturnValueOnce(Promise.resolve(tag));
      const result = await service.getNftTag('multiversx');
      expect(result).toEqual(expect.objectContaining({
        tag: 'multiversx',
        count: 100,
      }));
    });
  });
});
