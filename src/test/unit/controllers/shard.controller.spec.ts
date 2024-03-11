import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ShardController } from "src/endpoints/shards/shard.controller";
import { ShardModule } from "src/endpoints/shards/shard.module";
import { ShardService } from "src/endpoints/shards/shard.service";
import { mockShardService } from "./services.mock/shard.service.mock";
import request = require('supertest');
import { QueryPagination } from "src/common/entities/query.pagination";

describe('ShardController', () => {
  let app: INestApplication;
  const path: string = "/shards";
  const shardServiceMock = mockShardService();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ShardController],
      imports: [ShardModule],
    })
      .overrideProvider(ShardService)
      .useValue(shardServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('GET /shards', () => {
    it('should return a list of shards', async () => {
      const mockShardList = [
        {
          "shard": 0,
          "validators": 800,
          "activeValidators": 799,
        },
        {
          "shard": 2,
          "validators": 800,
          "activeValidators": 800,
        },
        {
          "shard": 4294967295,
          "validators": 800,
          "activeValidators": 800,
        },
        {
          "shard": 1,
          "validators": 800,
          "activeValidators": 799,
        },
      ];
      shardServiceMock.getShards.mockResolvedValue(mockShardList);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .expect(mockShardList);

      expect(shardServiceMock.getShards).toHaveBeenCalledWith(
        new QueryPagination({ from: 0, size: 25 }));
    });
  });
});
