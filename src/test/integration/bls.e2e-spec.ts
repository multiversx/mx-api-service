import { Test } from "@nestjs/testing";
import { FileUtils } from "../../utils/file.utils";
import { PublicAppModule } from "src/public.app.module";
import { BlsService } from "../../endpoints/bls/bls.service";
import { ElasticService } from "../../common/elastic/elastic.service";
import { ApiConfigService } from "../../common/api-config/api.config.service";

describe('Bls Service', () => {
  let blsService: BlsService;
  let apiConfigService: ApiConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    blsService = moduleRef.get<BlsService>(BlsService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);
  });

  beforeEach(() => { jest.restoreAllMocks(); });

  describe('getBlsIndex', () => {
    it('should return bls index', async () => {
      const MOCK_PATH = apiConfigService.getMockPath();
      const blsValue = '00f9b676245ecf7bc74e3b644c106cfbbb366ce01a0149c1e50303d22c09bef7600f21f1925753ab994174b9926e9b078c2d1edaf03c221149ea0239722278aa864a1b26f298c29fe546fdb0ee1385243dfe407074e0dfa134c7e6d4197ce110';

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}bls.mock.json`)));

      const indexValue = await blsService.getBlsIndex(blsValue, 2, 608);
      expect(indexValue).toStrictEqual(26);
    });
  });

  describe('getPublicKeys', () => {
    it('should return public keys from shard 2 and epoch 608', async () => {
      const MOCK_PATH = apiConfigService.getMockPath();

      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () =>
          FileUtils.parseJSONFile(`${MOCK_PATH}bls.mock.json`)));

      const results = await blsService.getPublicKeys(2, 608);
      expect(results).toBeDefined();

      for (const result of results) {
        expect(typeof result).toStrictEqual('string');
      }
    });

    it('should return empty array because test simulate that no public keys are defined', async () => {
      jest
        .spyOn(ElasticService.prototype, 'get')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async () => []));

      const emptyKey = await blsService.getPublicKeys(1, 100);
      expect(emptyKey).toEqual([]);
    });
  });
});
