import { Test } from "@nestjs/testing";
import { MexTokenChartsService } from "src/endpoints/mex/mex.token.charts.service";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { MexTokenChart } from "src/endpoints/mex/entities/mex.token.chart";

describe('MexTokenChartsService', () => {
  let mexTokenChartsService: MexTokenChartsService;
  let graphQlService: GraphQlService;

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
      ],
    }).compile();

    mexTokenChartsService = moduleRef.get<MexTokenChartsService>(MexTokenChartsService);
    graphQlService = moduleRef.get<GraphQlService>(GraphQlService);
  });

  it('service should be defined', () => {
    expect(mexTokenChartsService).toBeDefined();
  });

  describe('getTokenPricesHourResolution', () => {
    it('should return an array of MexTokenChart when data is available', async () => {
      const mockData = {
        values24h: [
          { timestamp: '2023-05-08 10:00:00', value: '1.5' },
          { timestamp: '2023-05-08 11:00:00', value: '1.6' },
        ],
      };

      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue(mockData);

      const result = await mexTokenChartsService.getTokenPricesHourResolution('TOKEN-123456');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MexTokenChart);
      expect(result[0].timestamp).toBe(Math.floor(new Date('2023-05-08 10:00:00').getTime() / 1000));
      expect(result[0].value).toBe(1.5);
    });

    it('should return an empty array when no data is available', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue({});

      const result = await mexTokenChartsService.getTokenPricesHourResolution('TOKEN-123456');

      expect(result).toEqual([]);
    });

    it('should return an empty array when an error occurs', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockRejectedValue(new Error('GraphQL error'));

      const result = await mexTokenChartsService.getTokenPricesHourResolution('TOKEN-123456');

      expect(result).toEqual([]);
    });
  });

  describe('getTokenPricesDayResolution', () => {
    it('should return an array of MexTokenChart when data is available', async () => {
      const mockData = {
        latestCompleteValues: [
          { timestamp: '2023-05-01 00:00:00', value: '1.5' },
          { timestamp: '2023-05-02 00:00:00', value: '1.6' },
        ],
      };

      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue(mockData);

      const result = await mexTokenChartsService.getTokenPricesDayResolution('TOKEN-123456', '1683561648');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MexTokenChart);
      expect(result[0].timestamp).toBe(Math.floor(new Date('2023-05-01 00:00:00').getTime() / 1000));
      expect(result[0].value).toBe(1.5);
    });

    it('should return an empty array when no data is available', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockResolvedValue({});

      const result = await mexTokenChartsService.getTokenPricesDayResolution('TOKEN-123456', '1683561648');

      expect(result).toEqual([]);
    });

    it('should return an empty array when an error occurs', async () => {
      jest.spyOn(graphQlService, 'getExchangeServiceData').mockRejectedValue(new Error('GraphQL error'));

      const result = await mexTokenChartsService.getTokenPricesDayResolution('TOKEN-123456', '1683561648');

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
