import { ApiService, CachingService } from "@multiversx/sdk-nestjs";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataApiModule } from "src/common/data-api/data-api.module";
import { DataApiService } from "src/common/data-api/data-api.service";
import { DataApiToken } from "src/common/data-api/entities/data-api.token";
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/date.extensions';

describe('Data API Service', () => {
  const mockTokens: DataApiToken[] = [
    { identifier: 'EGLD', market: 'cex' },
    { identifier: 'USDC', market: 'cex' },
    { identifier: 'MEX-455c57', market: 'xexchange' },
    { identifier: 'RIDE-7d18e9', market: 'xexchange' },
    { identifier: 'ITHEUM-df6f26', market: 'xexchange' },
  ];
  const mockCexTokens = [
    { identifier: 'EGLD' },
    { identifier: 'USDC' },
  ];
  const mockXExchangeTokens = [
    { identifier: 'MEX-455c57' },
    { identifier: 'RIDE-7d18e9' },
    { identifier: 'ITHEUM-df6f26' },
  ];

  let service: DataApiService;
  let apiService: ApiService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataApiModule],
    }).compile();

    service = moduleRef.get<DataApiService>(DataApiService);
    apiService = moduleRef.get<ApiService>(ApiService);

    jest
      .spyOn(CachingService.prototype, 'getOrSetCache')
      // eslint-disable-next-line require-await
      .mockImplementation(jest.fn(async (_key: string, promise: any) => promise()));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEgldPrice', () => {
    it('should return undefined if the Data API feature is disabled', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(service, 'getEsdtTokenPrice').mockResolvedValueOnce(undefined);

      const result = await service.getEgldPrice(1672567200);

      expect(service.getEsdtTokenPrice).toBeCalledWith('EGLD', 1672567200);
      expect(result).toBeUndefined();
    });
  });

  describe('getEsdtTokenPrice', () => {
    it('should return undefined if the Data API feature is disabled', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(false);

      const result = await service.getEsdtTokenPrice('TOKEN');

      expect(result).toBeUndefined();
    });

    it('should return undefined if the token is not found', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(service, 'getDataApiToken').mockResolvedValueOnce(undefined);

      const result = await service.getEsdtTokenPrice('TOKEN');

      expect(service.getDataApiToken).toHaveBeenCalledWith('TOKEN');
      expect(result).toBeUndefined();
    });

    it('should return undefined when data API feature is disabled', async () => {
      jest.spyOn(service['apiConfigService'], 'isDataApiFeatureEnabled').mockReturnValue(false);

      const result = await service.getEsdtTokenPrice('EGLD', 123456789);
      expect(result).toBeUndefined();
    });

    it('should fetch the current token price from the data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementation(async () => ({ data: { price: 3.14 } }));

      const result = await service.getEsdtTokenPrice('EGLD');

      expect(result).toEqual(3.14);
    });

    it('should fetch token price from the data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementation(async () => ({ data: { price: 3.14 } }));

      const result = await service.getEsdtTokenPrice('EGLD', 1672567200);

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining("?date=2023-01-01"));
      expect(result).toEqual(3.14);
    });

    test('should return undefined when API call fails', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementationOnce(async () => new Error('An error occurred'));
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));

      const price = await service.getEsdtTokenPrice('EGLD');

      expect(apiService.get).toHaveBeenCalled();
      expect(price).toBeUndefined();
    });
  });

  describe('getDataApiTokens', () => {
    it('should return an empty array if the Data API feature is disabled', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(false);

      const result = await service.getDataApiTokensRaw();

      expect(result).toEqual([]);
    });

    it('should fetch tokens from the Data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementation(async (url) => ({ data: url.endsWith('cex') ? mockCexTokens : mockXExchangeTokens }));

      const result = await service.getDataApiTokensRaw();

      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokens);
    });

    it('should return an empty array if there is an error fetching tokens from the data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementationOnce(async () => new Error('An error occurred'));

      const result = await service.getDataApiTokensRaw();

      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });
  });

  describe('getDataApiToken', () => {
    it('should return undefined if the Data API feature is disabled', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(false);

      const result = await service.getDataApiToken('EGLD');

      expect(result).toBeUndefined();
    });

    it('should return undefined if tokens are empty', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve([]));

      const result = await service.getDataApiToken('EGLD');

      expect(result).toBeUndefined();
    });

    it('should return undefined if token is not found', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));

      const result = await service.getDataApiToken('X');

      expect(result).toBeUndefined();
    });

    it('should return the token if it is found', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));

      const result = await service.getDataApiToken('MEX-455c57');

      expect(result).toEqual({ identifier: 'MEX-455c57', market: 'xexchange' });
    });
  });
});
