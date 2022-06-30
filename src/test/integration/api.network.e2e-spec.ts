import { ApiService } from "@elrondnetwork/erdnest-common";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";

describe('API Service', () => {
  let apiService: ApiService;

  const apiUrl = 'https://api.elrond.com';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    apiService = moduleRef.get<ApiService>(ApiService);

  });

  describe('Get', () => {
    it(`GET request should not fail`, async () => {
      expect(await apiService.get(apiUrl)).toBeTruthy();
    });
  });

  describe('Head', () => {
    it(`HEAD request should not fail`, async () => {
      expect(await apiService.head(apiUrl)).toBeTruthy();
    });
  });
});
