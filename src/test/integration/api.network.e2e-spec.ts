import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { ApiService } from "../../common/network/api.service";

describe('API Service', () => {
  let apiService: ApiService;

  const apiUrl = 'https://api.elrond.com';

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    apiService = moduleRef.get<ApiService>(ApiService);

  }, Constants.oneHour() * 1000);

  describe('Get', () => {
    it(`GET request should not fail`, async () => {
      const getValue = await apiService.get(apiUrl);

      expect(getValue).toBeTruthy();
    });
  });

  describe('Head', () => {
    it(`HEAD request should not fail`, async () => {
      const headValue = await apiService.head(apiUrl);

      expect(headValue).toBeTruthy();
    });
  });
});
