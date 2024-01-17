import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { MiniBlock } from "src/common/indexer/entities";
import { IndexerService } from "src/common/indexer/indexer.service";
import { MiniBlockDetailed } from "src/endpoints/miniblocks/entities/mini.block.detailed";
import { MiniBlockFilter } from "src/endpoints/miniblocks/entities/mini.block.filter";
import { MiniBlockType } from "src/endpoints/miniblocks/entities/mini.block.type";
import { MiniBlockService } from "src/endpoints/miniblocks/mini.block.service";

describe('MiniBlockService', () => {
  let service: MiniBlockService;
  let indexerService: IndexerService;

  const mockResult: MiniBlock[] = [{
    miniBlockHash: '1fa4d7d45a3aebd9b53eea6646da9eb62eb3bb1b07fa0635de5e61f6c73053d8',
    senderShard: 0,
    receiverShard: 1,
    senderBlockHash: '22628f647a0c03ee54d9a30938ef3d9e7c5ea8e8f260263941fe5c5a21c815bd',
    receiverBlockHash: '22628f647a0c03ee54d9a30938ef3d9e7c5ea8e8f260263941fe5c5a21c815bd',
    type: 'SmartContractResultBlock',
    procTypeS: 'Normal',
    procTypeD: 'Normal',
    timestamp: 1682675478,
    receiverBlockNonce: '100',
    senderBlockNonce: '100',
  },
  {
    miniBlockHash: 'fdb0fb6b720e4908e633f6c4eae2e32b3248d8d545197d4fea3503dd4f79a12b',
    senderShard: 2,
    receiverShard: 1,
    senderBlockHash: '77f45e78191796af9ba80bbce5989f5404de3ae36c6785cb610495a04e2818e6',
    receiverBlockHash: '6daec94f6b3b4d416fc6c0321b6a1d141ff724559484a23267480e26516b9fb0',
    type: 'TxBlock',
    procTypeS: 'Normal',
    procTypeD: 'Normal',
    timestamp: 1683027636,
    receiverBlockNonce: '100',
    senderBlockNonce: '100',
  },
  ];

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MiniBlockService,
        {
          provide: IndexerService,
          useValue: {
            getMiniBlock: jest.fn().mockResolvedValueOnce(mockResult[0]),
            getMiniBlocks: jest.fn().mockResolvedValueOnce(mockResult),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<MiniBlockService>(MiniBlockService);
    indexerService = moduleRef.get<IndexerService>(IndexerService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMiniBlock', () => {
    it('should return a MiniBlockDetailed object', async () => {
      const miniBlockHash = '1fa4d7d45a3aebd9b53eea6646da9eb62eb3bb1b07fa0635de5e61f6c73053d8';

      const result = await service.getMiniBlock(miniBlockHash);

      expect(indexerService.getMiniBlock).toHaveBeenCalledWith(miniBlockHash);
      expect(result).toBeInstanceOf(MiniBlockDetailed);
    });
  });

  describe('getMiniBlocks', () => {
    it('should return an array of MiniBlockDetailed objects', async () => {
      const results = await service.getMiniBlocks(
        new QueryPagination({ size: 2 }),
        new MiniBlockFilter({ type: MiniBlockType.SmartContractResultBlock }));

      expect(indexerService.getMiniBlocks).toHaveBeenCalledWith(
        new QueryPagination({ size: 2 }),
        new MiniBlockFilter({ type: MiniBlockType.SmartContractResultBlock }));

      expect(results).toBeInstanceOf(Array);
      expect(results[0]).toBeInstanceOf(MiniBlockDetailed);
    });
  });
});
