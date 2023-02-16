import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { CollectionAuctionStats } from "src/endpoints/marketplace/entities/collection.auction.stats";
import { accountStatsQuery } from "src/endpoints/marketplace/graphql/account.stats.query";
import { NftMarketplaceService } from "src/endpoints/marketplace/nft.marketplace.service";
import { RootTestModule } from "src/test/root-test.module";

describe('Marketplace Service', () => {
  let service: NftMarketplaceService;
  let graphQlService: GraphQlService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootTestModule],
      providers: [NftMarketplaceService],
    }).compile();

    service = moduleRef.get<NftMarketplaceService>(NftMarketplaceService);
    graphQlService = moduleRef.get<GraphQlService>(GraphQlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuctions', () => {
    it('should return an array of auctions', async () => {
      const pagination = { size: 1 };

      jest.spyOn(service['graphQlService'], 'getNftServiceData').mockResolvedValue({
        auctions: {
          edges: [
            {
              node: {
                ownerAddress: 'erd1rwzt4gcqk9e6xqgzgvssdhad3l3pgzsqf08fqhzjrkkmp2kllgpsgppy4j',
                identifier: 'Test-2d29f9-0103',
                collection: 'Test-2d29f9',
                status: 'running',
                type: 'Nft',
                id: '842843',
                marketplaceAuctionId: '584150',
                marketplaceKey: 'xoxno',
                creationDate: '1676563203',
                endDate: 0,
                minBid: { amount: '1', token: '390000000000000000' },
                maxBid: { amount: '2', token: 'EGLD' },
              },
            },
          ],
          pageInfo: {
            endCursor: '123',
            hasNextPage: true,
          },
        },
      });

      const result = await service.getAuctions(new QueryPagination(pagination));

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          owner: 'erd1rwzt4gcqk9e6xqgzgvssdhad3l3pgzsqf08fqhzjrkkmp2kllgpsgppy4j',
          auctionId: 842843,
          identifier: 'Test-2d29f9-0103',
          collection: 'Test-2d29f9',
          status: 'running',
          auctionType: 'Nft',
          createdAt: '1676563203',
          endsAt: undefined,
          marketplaceAuctionId: '584150',
          marketplace: 'xoxno',
          minBid: { amount: '1', token: '390000000000000000' },
          maxBid: { amount: '2', token: 'EGLD' },
        }),
      ]));
    });

    it('should return an empty array when no auctions are returned from graphQlService', async () => {
      const pagination = { size: 1 };

      jest.spyOn(service['graphQlService'], 'getNftServiceData').mockReturnValueOnce(Promise.resolve(null));

      const result = await service.getAuctions(new QueryPagination(pagination));

      expect(result).toEqual([]);
    });
  });

  describe('getAccountStats', () => {
    it('should return account auction stats', async () => {
      const address: string = 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg';
      const graphqlResults = {
        accountStats: {
          auctions: '20',
          claimable: '0',
          collected: '2',
          collections: '12',
          creations: '0',
          likes: '33',
          orders: '0',
        },
      };

      jest.spyOn(service['graphQlService'], 'getNftServiceData').mockReturnValueOnce(Promise.resolve(graphqlResults));

      const result = await service.getAccountStats(address);

      expect(result).toEqual(expect.objectContaining({
        auctions: 20,
        claimable: 0,
        collected: 2,
        collections: 12,
        creations: 0,
        likes: 33,
        orders: 0,
      }));
    });

    it('should throw BadRequestException if result cannot be fetched', async () => {
      const address: string = 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg';

      jest.spyOn(service['graphQlService'], 'getNftServiceData').mockReturnValueOnce(Promise.resolve(null));

      await expect(service.getAccountStats(address)).rejects.toThrowError(BadRequestException);
      expect(graphQlService.getNftServiceData).toHaveBeenCalledWith(accountStatsQuery, { filters: { address } });
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection auction stat', async () => {
      const filters = {
        identifier: 'Test-2d29f9',
      };

      const expectedResult: CollectionAuctionStats = {
        activeAuctions: 10,
        endedAuctions: 20,
        maxPrice: '5060000000000000000',
        minPrice: '10000000000000',
        saleAverage: '1997758333333333333',
        volumeTraded: '23973100000000000000',
      };

      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValueOnce({
        collectionStats: {
          activeAuctions: expectedResult.activeAuctions,
          auctionsEnded: expectedResult.endedAuctions,
          maxPrice: expectedResult.maxPrice,
          minPrice: expectedResult.minPrice,
          saleAverage: expectedResult.saleAverage,
          volumeTraded: expectedResult.volumeTraded,
        },
      });

      const result = await service.getCollectionStats(filters);

      expect(result).toStrictEqual(expectedResult);
    });

    it('should throw a BadRequestException if result cannot be fetched', async () => {
      const filters = {
        identifier: 'Test-2d29f9',
      };

      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValueOnce(Promise.resolve(null));

      await expect(service.getCollectionStats(filters)).rejects.toThrowError(BadRequestException);
    });
  });
});
