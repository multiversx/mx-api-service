import { Test } from "@nestjs/testing";
import { BlockService } from "src/endpoints/blocks/block.service";
import { Block } from "src/endpoints/blocks/entities/block";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { PublicAppModule } from "src/public.app.module";
import { Constants } from "src/utils/constants";
import Initializer from "./e2e-init";

describe('Blocks Service', () => {
  let blocksService: BlockService;
  let blocks: Block[];
  let blockSentinel: Block;

  beforeAll(async () => {
    await Initializer.initialize();
  }, Constants.oneHour() * 1000);

  beforeEach(async () => {
    const publicAppModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    blocksService = publicAppModule.get<BlockService>(BlockService);
    blocks = await blocksService.getBlocks(new BlockFilter(), {from: 0, size: 25});
    blockSentinel = blocks[0];
  });

  describe('Blocks', () => {
    it('blocks should have hash, epoch and shard', async () => {
      for (let block of blocks) {
        expect(block).toHaveProperty('hash');
        expect(block).toHaveProperty('epoch');
        expect(block).toHaveProperty('shard');
      }
    });
    
    it('all entities should have block structure', async () => {
      for (let block of blocks) {
        expect(block).toHaveStructure(Object.keys(new Block()));
      }
    });

    it('should be sorted by timestamp in descending order', async () => {
      let index = 1;

      while (index < blocks.length) {
        expect(blocks[index-1]).toHaveProperty('timestamp');
        expect(blocks[index]).toHaveProperty('timestamp');
        expect(BigInt(blocks[index-1].timestamp)).toBeGreaterThanOrEqual(BigInt(blocks[index].timestamp));
        index ++;
      }
    });

    it('should be filtered by shard and epoch', async () => {
      const blocksFilter = new BlockFilter();
      blocksFilter.shard = 2;
      blocksFilter.epoch = 396
      const filteredBlocks = await blocksService.getBlocks(blocksFilter, {from: 0, size: 25});

      for (let block of filteredBlocks) {
        expect(block.shard).toStrictEqual(2);
        expect(block.epoch).toStrictEqual(396);
      }
    });

    it('should be filtered by block hash', async () => {
      const blockDetailed = await blocksService.getBlock(blockSentinel.hash);
      expect(blockDetailed?.hash).toStrictEqual(blockSentinel.hash);
      expect(blockDetailed).toHaveProperty('validators');
    });
  });
});