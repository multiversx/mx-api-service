import { HttpException, HttpStatus, INestApplication } from "@nestjs/common";
import { mockBlockService } from "./services.mock/block.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { BlockController } from "src/endpoints/blocks/block.controller";
import { BlockService } from "src/endpoints/blocks/block.service";
import request = require('supertest');
import { PublicAppModule } from "src/public.app.module";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";

describe("BlockController", () => {
  let app: INestApplication;
  const path = "/blocks";
  const blockServiceMock = mockBlockService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BlockController],
      imports: [PublicAppModule],
    })
      .overrideProvider(BlockService)
      .useValue(blockServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /blocks', () => {
    it('should return a list of blocks', async () => {
      const mockBlocksList = createMockBlocksList(10);
      blockServiceMock.getBlocks.mockResolvedValue(mockBlocksList);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(10);
          expect(response.body).toEqual(mockBlocksList);
        });
    });

    it('should filter blocks by shard', async () => {
      const shard = 1;
      const filteredBlocksList = createMockBlocksList(5);
      blockServiceMock.getBlocks.mockResolvedValue(filteredBlocksList);

      await request(app.getHttpServer())
        .get(`${path}?shard=${shard}`)
        .expect(200);

      expect(blockServiceMock.getBlocks).toHaveBeenCalledWith(
        expect.objectContaining({ shard: 1 }),
        expect.objectContaining({ from: 0, size: 25 }),
        undefined
      );
    });

    it('should filter blocks by timestamp and ordered desc', async () => {
      const orderBlock = SortOrder.desc;
      const filteredBlocksList = createMockBlocksList(5);
      blockServiceMock.getBlocks.mockResolvedValue(filteredBlocksList);

      await request(app.getHttpServer())
        .get(`${path}?order=${orderBlock}`)
        .expect(200);

      expect(blockServiceMock.getBlocks).toHaveBeenCalledWith(
        expect.objectContaining({ order: orderBlock }),
        expect.objectContaining({ from: 0, size: 25 }),
        undefined
      );
    });

    it('should filter blocks by timestamp and ordered asc', async () => {
      const orderBlock = SortOrder.asc;
      const filteredBlocksList = createMockBlocksList(5);
      blockServiceMock.getBlocks.mockResolvedValue(filteredBlocksList);

      await request(app.getHttpServer())
        .get(`${path}?order=${orderBlock}`)
        .expect(200);

      expect(blockServiceMock.getBlocks).toHaveBeenCalledWith(
        expect.objectContaining({ order: orderBlock }),
        expect.objectContaining({ from: 0, size: 25 }),
        undefined
      );
    });

    it('should paginate the blocks list', async () => {
      const queryPagination = new QueryPagination({ from: 0, size: 5 });
      const paginatedBlocksList = createMockBlocksList(queryPagination.size);
      blockServiceMock.getBlocks.mockResolvedValue(paginatedBlocksList);

      await request(app.getHttpServer())
        .get(`${path}?from=${queryPagination.from}&size=${queryPagination.size}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(queryPagination.size);
        });
    });

    it('should filter blocks by epoch', async () => {
      const epoch = 100;
      const filteredBlocksList = createMockBlocksList(3).map(block => ({ ...block, epoch }));
      blockServiceMock.getBlocks.mockResolvedValue(filteredBlocksList);

      await request(app.getHttpServer())
        .get(`${path}?epoch=${epoch}`)
        .expect(200)
        .expect(response => {
          expect(response.body.every((block: { epoch: number; }) => block.epoch === epoch)).toBeTruthy();
        });
    });
  });

  describe('GET /blocks/count', () => {
    it('should return the total count of all blocks', async () => {
      const totalBlocksCount = 12345;
      blockServiceMock.getBlocksCount.mockResolvedValue(totalBlocksCount);

      const response = await request(app.getHttpServer())
        .get(`${path}/count`)
        .expect(200);

      expect(+response.text).toEqual(totalBlocksCount);
      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({});
    });

    it('should return the count of blocks for a specific shard', async () => {
      const shardBlocksCount = 2345;
      blockServiceMock.getBlocksCount.mockResolvedValue(shardBlocksCount);

      await request(app.getHttpServer())
        .get(`${path}/count?shard=1`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(shardBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ shard: 1 });
    });

    it('should return the count of blocks filtered by proposer', async () => {
      const proposerBlocksCount = 345;
      blockServiceMock.getBlocksCount.mockResolvedValue(proposerBlocksCount);
      const proposer = 'f0403707977aed967d5ecca08b5a17aa98b2f714499cc41c07763d5d3552efa9067e0de794559eaa1bde7a1183ccbf014faefd43a588596f737357aeb8e35debc373f719c7ecd06f9d434ca90dd6576bd2040ce91b224b7ba26f8ea70932b58c';

      await request(app.getHttpServer())
        .get(`${path}/count?proposer=${proposer}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(proposerBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ proposer });
    });

    it('should return the count of blocks filtered by multiple parameters', async () => {
      const filteredBlocksCount = 45;
      blockServiceMock.getBlocksCount.mockResolvedValue(filteredBlocksCount);
      const shard = 1;
      const epoch = 10;

      await request(app.getHttpServer())
        .get(`${path}/count?shard=${shard}&epoch=${epoch}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(filteredBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ shard, epoch });
    });

    it('should handle invalid query parameters gracefully', async () => {
      await request(app.getHttpServer())
        .get('/blocks/count?shard=invalidShard')
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'shard' (optional number is expected)");
        });
    });
  });

  describe('GET /blocks/c', () => {
    it('should return the total count of all blocks', async () => {
      const totalBlocksCount = 12345;
      blockServiceMock.getBlocksCount.mockResolvedValue(totalBlocksCount);

      const response = await request(app.getHttpServer())
        .get(`${path}/c`)
        .expect(200);

      expect(+response.text).toEqual(totalBlocksCount);
      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({});
    });

    it('should return the count of blocks for a specific shard', async () => {
      const shardBlocksCount = 2345;
      blockServiceMock.getBlocksCount.mockResolvedValue(shardBlocksCount);

      await request(app.getHttpServer())
        .get(`${path}/c?shard=1`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(shardBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ shard: 1 });
    });

    it('should return the count of blocks filtered by proposer', async () => {
      const proposerBlocksCount = 345;
      blockServiceMock.getBlocksCount.mockResolvedValue(proposerBlocksCount);
      const proposer = 'f0403707977aed967d5ecca08b5a17aa98b2f714499cc41c07763d5d3552efa9067e0de794559eaa1bde7a1183ccbf014faefd43a588596f737357aeb8e35debc373f719c7ecd06f9d434ca90dd6576bd2040ce91b224b7ba26f8ea70932b58c';

      await request(app.getHttpServer())
        .get(`${path}/c?proposer=${proposer}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(proposerBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ proposer });
    });

    it('should return the count of blocks filtered by multiple parameters', async () => {
      const filteredBlocksCount = 45;
      blockServiceMock.getBlocksCount.mockResolvedValue(filteredBlocksCount);
      const shard = 1;
      const epoch = 10;

      await request(app.getHttpServer())
        .get(`${path}/c?shard=${shard}&epoch=${epoch}`)
        .expect(200)
        .expect(response => {
          expect(+response.text).toEqual(filteredBlocksCount);
        });

      expect(blockServiceMock.getBlocksCount).toHaveBeenCalledWith({ shard, epoch });
    });

    it('should handle invalid query parameters gracefully', async () => {
      await request(app.getHttpServer())
        .get('/blocks/c?shard=invalidShard')
        .expect(400)
        .expect(response => {
          expect(response.body.message).toStrictEqual("Validation failed for argument 'shard' (optional number is expected)");
        });
    });
  });

  describe('GET /blocks/latest', () => {
    it('should return the latest block details', async () => {
      const mockLatestBlock = createMockBlocksList(1)[0];
      blockServiceMock.getLatestBlock.mockResolvedValue(mockLatestBlock);

      await request(app.getHttpServer())
        .get(`${path}/latest`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(mockLatestBlock);
        });
    });

    it('should return 404 Not Found when no block is found', async () => {
      blockServiceMock.getLatestBlock.mockResolvedValue(null);
      await request(app.getHttpServer())
        .get(`${path}/latest`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toEqual("Block not found");
        });
    });

    it('should calculate the nonce frequency based on ttl value', async () => {
      const mockBlockWithTTL = createMockBlocksList(1)[0];
      blockServiceMock.getLatestBlock.mockResolvedValue(mockBlockWithTTL);

      const ttl = 3600;
      await request(app.getHttpServer())
        .get(`${path}/latest?ttl=${ttl}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(mockBlockWithTTL);
        });
    });
  });


  describe("GET /blocks/:hash", () => {
    it('should return block information details for a given hash', async () => {
      const mockBlockDetailed = createMockBlocksList(1)[0];
      const blockHash = mockBlockDetailed.hash;
      blockServiceMock.getBlock.mockResolvedValue(mockBlockDetailed);

      await request(app.getHttpServer())
        .get(`${path}/${blockHash}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(mockBlockDetailed);
        });
    });

    it('should return a 404 Not Found when the block does not exist', async () => {
      const blockHash = '7ecdb6028565f92851170c70443a5c2099af1f740f0560d60429194bac14b521';
      blockServiceMock.getBlock.mockRejectedValue(new HttpException('Block not found', HttpStatus.NOT_FOUND));

      await request(app.getHttpServer())
        .get(`${path}/${blockHash}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toEqual('Block not found');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function generateRandomHash() {
    return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  function generateRandomProposer() {
    return [...Array(128)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  function createMockBlocksList(numberOfBlocks: any) {
    return Array.from({ length: numberOfBlocks }, () => ({
      hash: generateRandomHash(),
      epoch: Math.floor(Math.random() * 1000),
      nonce: Math.floor(Math.random() * 10000),
      prevHash: generateRandomHash(),
      proposer: generateRandomProposer(),
      pubKeyBitmap: 'ffffffffffffff7f',
      round: Math.floor(Math.random() * 100000),
      shard: Math.floor(Math.random() * 3),
      size: Math.floor(Math.random() * 1000) + 500,
      sizeTxs: Math.floor(Math.random() * 6000),
      stateRootHash: generateRandomHash(),
      timestamp: Date.now() / 1000 - Math.floor(Math.random() * 100000),
      txCount: Math.floor(Math.random() * 100),
      gasConsumed: Math.floor(Math.random() * 1000000),
      gasRefunded: Math.floor(Math.random() * 100000),
      gasPenalized: Math.floor(Math.random() * 10000),
      maxGasLimit: Math.floor(Math.random() * 10000000),
      scheduledRootHash: generateRandomHash(),
    }));
  }
});
