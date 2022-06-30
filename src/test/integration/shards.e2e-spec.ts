import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { Test } from "@nestjs/testing";
import { ShardService } from "src/endpoints/shards/shard.service";
import { PublicAppModule } from "src/public.app.module";
import { Shard } from "src/endpoints/shards/entities/shard";
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest-common/lib/src/utils/extensions/array.extensions';
import { ElasticService, FileUtils } from '@elrondnetwork/erdnest-common';

describe('Shard Service', () => {
  let shardService: ShardService;
  let apiConfigService: ApiConfigService;

  const shards: Shard[] = [
    { shard: 1, validators: 800, activeValidators: 799 },
    { shard: 2, validators: 800, activeValidators: 801 },
  ];

  const allShards: Shard[] = [
    { shard: 1, validators: 800, activeValidators: 700 },
    { shard: 2, validators: 800, activeValidators: 800 },
    { shard: 4294967295, validators: 800, activeValidators: 800 },
    { shard: 0, validators: 800, activeValidators: 800 },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    shardService = moduleRef.get<ShardService>(ShardService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe("getShards", () => {
    it("should return 2 shards with activeValidators and validators detailes", async () => {
      jest
        .spyOn(ShardService.prototype, 'getAllShardsRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => {
          return shards;
        }));

      const results = await shardService.getShards({ from: 0, size: 3 });

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Shard()));
      }

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ shard: 1, validators: 800, activeValidators: 799 }),
          expect.objectContaining({ shard: 2, validators: 800, activeValidators: 801 }),
        ])
      );
    });
  });

  describe("getAllShards", () => {
    it("should return all shards", async () => {
      jest
        .spyOn(ShardService.prototype, 'getAllShardsRaw')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => {
          return allShards;
        }));

      const results = await shardService.getAllShards();

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ shard: 1, validators: 800, activeValidators: 700 }),
          expect.objectContaining({ shard: 2, validators: 800, activeValidators: 800 }),
          expect.objectContaining({ shard: 4294967295, validators: 800, activeValidators: 800 }),
          expect.objectContaining({ shard: 0, validators: 800, activeValidators: 800 }),
        ])
      );
    });
  });

  describe("getAllShardsRaw", () => {
    it("should return all shards raw", async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}bls.mock.json`)));

      const results = await shardService.getAllShardsRaw();

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Shard()));
        expect(result).toHaveProperties(['shard', 'validators', 'activeValidators']);
      }
    });
  });
});
