import { HttpException, HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MiniBlockController } from "src/endpoints/miniblocks/mini.block.controller";
import { MiniBlockService } from "src/endpoints/miniblocks/mini.block.service";
import { MiniBlockModule } from "src/endpoints/miniblocks/miniblock.module";
import { mockMiniBlockService } from "./services.mock/mini.block.service.mock";
import request = require('supertest');
import { QueryPagination } from "src/common/entities/query.pagination";

describe("MiniBlockController", () => {
  let app: INestApplication;
  const path = "/miniblocks";
  const miniBlockServiceMock = mockMiniBlockService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MiniBlockController],
      imports: [MiniBlockModule],
    })
      .overrideProvider(MiniBlockService)
      .useValue(miniBlockServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("GET /miniblocks", () => {
    it('should return an array of miniblocks', async () => {
      const mockMiniBlocks = createMockMiniBlocksList(10);
      miniBlockServiceMock.getMiniBlocks.mockResolvedValue(mockMiniBlocks);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(response => {
          expect(response.body.length).toBe(10);
          expect(response.body).toEqual(mockMiniBlocks);
        });
    });

    it('GET /miniblocks - should paginate miniblocks', async () => {
      const mockMiniBlocks = createMockMiniBlocksList(50);
      const queryPagination = new QueryPagination({ from: 10, size: 5 });
      miniBlockServiceMock.getMiniBlocks.mockResolvedValue(
        mockMiniBlocks.slice(queryPagination.from, queryPagination.from + queryPagination.size));

      await request(app.getHttpServer())
        .get(`${path}?from=${queryPagination.from}&size=${queryPagination.size}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.length).toBe(queryPagination.size);
        });
    });
  });

  describe("GET /miniblocks/:miniBlockHash", () => {
    it('should return miniblock details for a given hash', async () => {
      const mockMiniBlock = createMockMiniBlocksList(1)[0];
      miniBlockServiceMock.getMiniBlock.mockResolvedValue(mockMiniBlock);

      await request(app.getHttpServer())
        .get(`${path}/${mockMiniBlock.miniBlockHash}`)
        .expect(200)
        .expect((response) => {
          expect(response.body).toEqual(mockMiniBlock);
        });
    });

    it('should return 404 Not Found when miniblock is not found', async () => {
      const nonExistentMiniBlockHash = '0a60659a3ab7384a097e55fa9450b31f88a10faafd6d32a1cec10c69100079bs';
      miniBlockServiceMock.getMiniBlock.mockRejectedValue(new HttpException('Miniblock not found', HttpStatus.NOT_FOUND));

      await request(app.getHttpServer())
        .get(`${path}/${nonExistentMiniBlockHash}`)
        .expect(404)
        .expect((response) => {
          expect(response.body.message).toEqual('Miniblock not found');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});


function createMockMiniBlocksList(numberOfMiniBlocks: number) {
  const miniBlocks = [];

  for (let i = 0; i < numberOfMiniBlocks; i++) {
    miniBlocks.push({
      miniBlockHash: generateRandomHash(),
      receiverBlockHash: generateRandomHash(),
      receiverShard: Math.floor(Math.random() * 3),
      senderBlockHash: generateRandomHash(),
      senderShard: Math.floor(Math.random() * 3),
      timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 100000),
      type: 'TxBlock',
    });
  }

  return miniBlocks;
}

function generateRandomHash() {
  return [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}
