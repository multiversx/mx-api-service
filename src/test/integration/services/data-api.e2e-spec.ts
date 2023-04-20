import { ApiService } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Test } from "@nestjs/testing";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataApiModule } from "src/common/data-api/data-api.module";
import { DataApiService } from "src/common/data-api/data-api.service";
import { DataApiToken } from "src/common/data-api/entities/data-api.token";
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';

describe('Data API Service', () => {
  const mockTokens: Record<string, DataApiToken> = {
    'EGLD': { identifier: 'EGLD', market: 'cex' },
    'USDC': { identifier: 'USDC', market: 'cex' },
    'MEX-455c57': { identifier: 'MEX-455c57', market: 'xexchange' },
    'RIDE-7d18e9': { identifier: 'RIDE-7d18e9', market: 'xexchange' },
    'ITHEUM-df6f26': { identifier: 'ITHEUM-df6f26', market: 'xexchange' },
  };

  let service: DataApiService;
  let apiService: ApiService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DataApiModule],
    }).compile();

    service = moduleRef.get<DataApiService>(DataApiService);
    apiService = moduleRef.get<ApiService>(ApiService);

    jest
      .spyOn(CacheService.prototype, 'getOrSet')
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
      jest.spyOn(apiService, 'get').mockImplementation(async () => ({ data: 3.14 }));

      const result = await service.getEsdtTokenPrice('EGLD');

      expect(result).toEqual(3.14);
    });

    it('should fetch token price from the data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementation(async () => ({ data: 3.14 }));

      const result = await service.getEsdtTokenPrice('EGLD', 1672567200);

      expect(apiService.get).toHaveBeenCalledWith(expect.stringContaining("&date=2023-01-01"));
      expect(result).toEqual(3.14);
    });

    test('should return undefined when API call fails', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      // eslint-disable-next-line require-await
      jest.spyOn(apiService, 'get').mockImplementationOnce(async () => { throw new Error('An error occurred'); });
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve(mockTokens));
      jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      const price = await service.getEsdtTokenPrice('EGLD');

      expect(apiService.get).toHaveBeenCalled();
      expect(service['logger'].error).toHaveBeenCalled();
      expect(price).toBeUndefined();
    });
  });

  describe('getDataApiTokens', () => {
    it('returns an empty object if data API feature is disabled', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(false);

      const result = await service.getDataApiTokensRaw();

      expect(result).toEqual({});
    });

    it('should fetch tokens from the Data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(ApiConfigService.prototype, 'getDataApiServiceUrl').mockReturnValueOnce('https://data-api.multiversx.com');
      const mockCexTokens = { data: [{ identifier: 'EGLD' }, { identifier: 'USDC' }] };
      const mockXExchangeTokens = { data: [{ identifier: 'MEX-455c57' }, { identifier: 'RIDE-7d18e9' }, { identifier: 'ITHEUM-df6f26' }] };
      jest.spyOn(apiService, 'get')
        .mockReturnValueOnce(Promise.resolve(mockCexTokens))
        .mockReturnValueOnce(Promise.resolve(mockXExchangeTokens));

      const result = await service.getDataApiTokensRaw();

      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        'EGLD': { identifier: 'EGLD', market: 'cex' },
        'USDC': { identifier: 'USDC', market: 'cex' },
        'MEX-455c57': { identifier: 'MEX-455c57', market: 'xexchange' },
        'RIDE-7d18e9': { identifier: 'RIDE-7d18e9', market: 'xexchange' },
        'ITHEUM-df6f26': { identifier: 'ITHEUM-df6f26', market: 'xexchange' },
      });
    });

    it('should return an empty array if there is an error fetching tokens from the data API', async () => {
      jest.spyOn(ApiConfigService.prototype, 'isDataApiFeatureEnabled').mockReturnValueOnce(true);
      jest.spyOn(apiService, 'get').mockRejectedValueOnce(new Error('An error occurred'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() => { });

      const result = await service.getDataApiTokensRaw();

      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(service['logger'].error).toHaveBeenCalled();
      expect(result).toEqual({});
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
      jest.spyOn(DataApiService.prototype, 'getDataApiTokens').mockReturnValueOnce(Promise.resolve({}));

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
