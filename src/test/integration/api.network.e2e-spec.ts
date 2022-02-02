import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { ApiService } from "../../common/network/api.service";
import { ApiSettings } from "../../common/network/entities/api.settings";

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
    it(`should return true if url exist and have apiSetting responseType = 'json'`, async () => {
      const apiSettings = new ApiSettings();
      apiSettings.responseType = 'json';
      const getValue = await apiService.get(apiUrl, apiSettings);

      expect(getValue).toBeTruthy();
    });
  });

  describe('Head', () => {
    it(`should return true if url exist and have apiSetting responseType = 'json'`, async () => {
      const apiSettings = new ApiSettings();
      apiSettings.responseType = 'json';
      const headValue = await apiService.head(apiUrl, apiSettings);

      expect(headValue).toBeTruthy();
    });
  });
});
