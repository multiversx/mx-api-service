import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ShardService } from "src/endpoints/shards/shard.service";

describe('ShardService', () => {
  let service: ShardService;
  let nodeService: NodeService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ShardService,
        {
          provide: NodeService,
          useValue: {
            getAllNodes: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue:
          {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<ShardService>(ShardService);
    nodeService = moduleRef.get<NodeService>(NodeService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllShards', () => {
    it('should return shards details', async () => {
      const data = require('../../mocks/nodes.mock.json');
      nodeService.getAllNodes = jest.fn().mockResolvedValue(data);

      const result = await service.getShards(new QueryPagination());
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining(
          { shard: 1, validators: 24, activeValidators: 24 },
        ),
        expect.objectContaining(
          { shard: 0, validators: 24, activeValidators: 23 },
        ),
        expect.objectContaining(
          { shard: 4294967295, validators: 25, activeValidators: 25 },
        ),
        expect.objectContaining(
          { shard: 2, validators: 24, activeValidators: 24 },
        ),
      ]));
    });
  });
});
