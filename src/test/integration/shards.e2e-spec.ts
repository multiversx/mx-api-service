import { Test } from "@nestjs/testing";
import { ShardService } from "src/endpoints/shards/shard.service";
import { PublicAppModule } from "src/public.app.module";
import { Shard } from "src/endpoints/shards/entities/shard";
import '../../utils/extensions/jest.extensions';
import '../../utils/extensions/array.extensions';

describe('Shard Service', () => {
  let shardService: ShardService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    shardService = moduleRef.get<ShardService>(ShardService);
  });

  describe("Get Shards", () => {
    it("should return one shard", async () => {
      const results = await shardService.getShards({ from: 0, size: 1 });

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Shard()));
      }
    });

    it("should return three shards", async () => {
      const results = await shardService.getShards({ from: 0, size: 3 });

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Shard()));
      }
    });

    it("should return all shards", async () => {
      const results = await shardService.getAllShards();

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Shard()));
      }
    });
  });
});
