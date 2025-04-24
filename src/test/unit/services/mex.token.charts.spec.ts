import { Test } from "@nestjs/testing";
import { MexTokenChartsService } from "src/endpoints/mex/mex.token.charts.service";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexTokenChart } from "src/endpoints/mex/entities/mex.token.chart";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { MexToken } from "src/endpoints/mex/entities/mex.token";
import { CacheService } from "@multiversx/sdk-nestjs-cache";

describe('MexTokenChartsService', () => {
  let mexTokenChartsService: MexTokenChartsService;
  let graphQlService: GraphQlService;
  let mexTokenService: MexTokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MexTokenChartsService,
        {
          provide: GraphQlService,
          useValue: {
            getExchangeServiceData: jest.fn(),
          },
        },
        {
          provide: MexTokenService,
          useValue: {
            getMexTokenByIdentifier: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    mexTokenChartsService = moduleRef.get<MexTokenChartsService>(MexTokenChartsService);
    graphQlService = moduleRef.get<GraphQlService>(GraphQlService);
    mexTokenService = moduleRef.get<MexTokenService>(MexTokenService);
  });

  it('service should be defined', () => {
    expect(mexTokenChartsService).toBeDefined();
  });

  describe('getTokenPricesHourResolutionRaw', () => {
    it('should return an array of MexTokenChart when data is available', async () => {
      const mockToken: MexToken = { id: 'TOKEN-123456', symbol: 'TEST', name: 'Test Token' } as MexToken;
      const mockData = {
        values24h: [
          { timestamp: '2023-05-08 10:00:00', value: '1.5' },
          { timestamp: '2023-05-08 11:00:00', value: '1.6' },
        ],
      };

      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue(mockData);
      jest.spyOn(mexTokenService, 'getMexTokenByIdentifier').mockResolvedValue(mockToken);
      jest.spyOn(mexTokenChartsService as any, 'isMexToken').mockReturnValue(true);

      const result = await mexTokenChartsService.getTokenPricesHourResolutionRaw('TOKEN-123456');

      if (result) {
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MexTokenChart);
        expect(result[0].timestamp).toBe(Math.floor(new Date('2023-05-08 10:00:00').getTime() / 1000));
        expect(result[0].value).toBe(1.5);
      }
    });

    it('should return an empty array when no data is available', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue({});
      jest.spyOn(mexTokenChartsService as any, 'isMexToken').mockReturnValue(true);

      const result = await mexTokenChartsService.getTokenPricesHourResolutionRaw('TOKEN-123456');

      expect(result).toEqual([]);
    });
  });

  describe('getTokenPricesDayResolutionRaw', () => {
    it('should return an array of MexTokenChart when data is available', async () => {
      const mockToken: MexToken = { id: 'TOKEN-123456', symbol: 'TEST', name: 'Test Token' } as MexToken;

      const mockData = {
        latestCompleteValues: [
          { timestamp: '2023-05-01 00:00:00', value: '1.5' },
          { timestamp: '2023-05-02 00:00:00', value: '1.6' },
        ],
      };

      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue(mockData);
      jest.spyOn(mexTokenService, 'getMexTokenByIdentifier').mockResolvedValue(mockToken);
      jest.spyOn(mexTokenChartsService as any, 'isMexToken').mockReturnValue(true);

      const result = await mexTokenChartsService.getTokenPricesDayResolutionRaw('TOKEN-123456');

      if (result) {
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(MexTokenChart);
        expect(result[0].timestamp).toBe(Math.floor(new Date('2023-05-01 00:00:00').getTime() / 1000));
        expect(result[0].value).toBe(1.5);
      }
    });

    it('should return an empty array when no data is available', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue({});
      jest.spyOn(mexTokenChartsService as any, 'isMexToken').mockReturnValue(true);
      const result = await mexTokenChartsService.getTokenPricesDayResolutionRaw('TOKEN-123456');

      expect(result).toEqual([]);
    });
  });

  describe('convertToMexTokenChart', () => {
    it('should correctly convert data to MexTokenChart array', () => {
      const inputData = [
        { timestamp: '2023-05-08 10:00:00', value: '1.5' },
        { timestamp: '2023-05-08 11:00:00', value: '1.6' },
      ];

      const result = mexTokenChartsService['convertToMexTokenChart'](inputData);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MexTokenChart);
      expect(result[0].timestamp).toBe(Math.floor(new Date('2023-05-08 10:00:00').getTime() / 1000));
      expect(result[0].value).toBe(1.5);
      expect(result[1].timestamp).toBe(Math.floor(new Date('2023-05-08 11:00:00').getTime() / 1000));
      expect(result[1].value).toBe(1.6);
    });
  });
});
