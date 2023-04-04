import { ElrondCachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { IndexerService } from "src/common/indexer/indexer.service";
import { BlockService } from "src/endpoints/blocks/block.service";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { NodeService } from "src/endpoints/nodes/node.service";

describe('Block Service', () => {
  let blockService: BlockService;
  let indexerService: IndexerService;
  let elrondCachingService: ElrondCachingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BlockService,
        {
          provide: IndexerService, useValue: {
            getBlocksCount: jest.fn(),
            getBlocks: jest.fn(),
            getBlock: jest.fn(),
          },
        },
        {
          provide: ElrondCachingService, useValue: {
            getOrSet: jest.fn(),
            getCacheLocal: jest.fn(),
            setCacheLocal: jest.fn(),
          },
        },
        {
          provide: BlsService, useValue: {
            getPublicKeys: jest.fn(),
          },
        },
        {
          provide: NodeService, useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: IdentitiesService, useValue: {
            getIdentity: jest.fn(),
          },
        },
      ],
    }).compile();

    blockService = moduleRef.get<BlockService>(BlockService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
    elrondCachingService = moduleRef.get<ElrondCachingService>(ElrondCachingService);
  });

  describe('getBlocksCount', () => {
    it('should return the cached value when filter is undefined', async () => {
      const expectedCount = 100;
      jest.spyOn(elrondCachingService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
        const result = await promise();
        expect(result).toEqual(expectedCount);
        return result;
      });

      jest.spyOn(indexerService, 'getBlocksCount').mockResolvedValueOnce(expectedCount);

      const result = await blockService.getBlocksCount({});
      expect(indexerService.getBlocksCount).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedCount);
    });

    it('should call indexerService.getBlocksCount when filter is defined', async () => {
      const expectedCount = 100;
      const filter: BlockFilter = { epoch: 123, shard: 0 };
      jest.spyOn(elrondCachingService, 'getOrSet').mockImplementationOnce(async (_key: string, promise: any) => {
        const result = await promise();
        expect(result).toEqual(expectedCount);
        return result;
      });

      jest.spyOn(indexerService, 'getBlocksCount').mockResolvedValueOnce(expectedCount);

      const result = await blockService.getBlocksCount(filter);

      expect(indexerService.getBlocksCount).toHaveBeenCalledWith(filter);
      expect(result).toEqual(expectedCount);
    });
  });

  describe('getBlocks', () => {
    it('should return an empty array when the indexer returns an empty array', async () => {
      jest.spyOn(indexerService, 'getBlocks').mockResolvedValueOnce([]);
      const result = await blockService.getBlocks({ shard: 0, epoch: 123 }, { from: 0, size: 10 });
      expect(result).toEqual([]);
    });
  });
});
