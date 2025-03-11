import { TestingModule, Test } from "@nestjs/testing";
import { GraphQLClient } from "graphql-request";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GraphQlService } from "src/common/graphql/graphql.service";

jest.mock('graphql-request');

describe('GraphQlService', () => {
  let service: GraphQlService;
  let mockApiConfigService: Partial<ApiConfigService>;
  let mockGraphQLClient: Partial<GraphQLClient>;

  beforeEach(async () => {
    mockApiConfigService = {
      getExchangeServiceUrlMandatory: jest.fn().mockReturnValue('https://graph.xexchange.com/graphql'),
      getMarketplaceServiceUrl: jest.fn().mockReturnValue('https://nfts-graph.multiversx.com/graphql'),
      getSelfUrl: jest.fn().mockReturnValue('https://api.multiversx.com'),
    };

    mockGraphQLClient = {
      request: jest.fn(),
    };

    GraphQLClient.prototype.request = mockGraphQLClient.request as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphQlService,
        { provide: ApiConfigService, useValue: mockApiConfigService },
      ],
    }).compile();

    service = module.get<GraphQlService>(GraphQlService);
  });

  describe('getData', () => {
    it('should return data if the request is successful', async () => {
      const mockData = { key: 'value' };
      jest.spyOn(mockGraphQLClient, 'request').mockResolvedValueOnce(mockData);
      const result = await service.getExchangeServiceData('query', {});
      expect(result).toStrictEqual(mockData);
    });

    it('should return null if the request fails', async () => {
      jest.spyOn(mockGraphQLClient, 'request').mockRejectedValueOnce(new Error('Unexpected error when running graphql query'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        "Unexpected error when running graphql query");

      const result = await service.getExchangeServiceData('query', {});
      expect(result).toBeNull();
    });
  });

  describe('getNftServiceData', () => {
    it('should return data if the request is successful', async () => {
      const mockData = { key: 'value' };
      jest.spyOn(mockGraphQLClient, 'request').mockResolvedValueOnce(mockData);
      const result = await service.getNftServiceData('query', {});
      expect(result).toStrictEqual(mockData);
    });

    it('should return null if the request fails', async () => {
      jest.spyOn(mockGraphQLClient, 'request').mockRejectedValueOnce(new Error('Unexpected error when running graphql query'));
      jest.spyOn(service['logger'], 'error').mockImplementation(() =>
        "Unexpected error when running graphql query");

      const result = await service.getNftServiceData('query', {});
      expect(result).toBeNull();
    });
  });
});
