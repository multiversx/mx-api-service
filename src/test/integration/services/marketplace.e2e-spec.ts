import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { Auction } from "src/endpoints/marketplace/entities/account.auctions";
import { AuctionStatus } from "src/endpoints/marketplace/entities/auction.status";
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

  describe('getAccountAuctions', () => {
    it('should return an array of auctions for a specific address with status auction = running', async () => {
      const address: string = 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg';

      const result = {
        auctions: {
          edges: [
            {
              node: {
                id: '1',
                identifier: 'Test-2d29f9-1',
                collection: 'Test-2d29f9',
                status: 'running',
                creationDate: '1666878937',
                endDate: 1666879104,
                marketplace: {
                  key: 'xoxno',
                },
                marketplaceAuctionId: '373650',
                minBid: {
                  amount: '123456',
                  token: 'EGLD',
                },
                maxBid: {
                  amount: '654321',
                  token: 'EGLD',
                },
              },
            },
            {
              node: {
                id: '2',
                identifier: 'Test-2d29f9-2',
                collection: 'Test-2d29f9',
                status: 'ended',
                creationDate: '1666878937',
                endDate: 1666879104,
                marketplace: {
                  key: 'framit',
                },
                marketplaceAuctionId: '373650',
                minBid: {
                  amount: '123456',
                  token: 'EGLD',
                },
                maxBid: {
                  amount: '654321',
                  token: 'EGLD',
                },
              },
            },
          ],
        },
      };

      const state: AuctionStatus = AuctionStatus.running;

      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(result);

      const actual = await service.getAccountAuctions(new QueryPagination({ size: 2 }), address, state);

      expect(actual).toEqual(expect.arrayContaining([
        expect.objectContaining({
          auctionId: 1,
          identifier: 'Test-2d29f9-1',
          collection: 'Test-2d29f9',
          status: 'running',
          auctionType: '',
          createdAt: '1666878937',
          endsAt: undefined,
          marketplaceAuctionId: '373650',
          marketplace: 'xoxno',
          minBid: { amount: '123456', token: 'EGLD' },
          maxBid: { amount: '654321', token: 'EGLD' },
        }),
      ]));
    });

    it('should return an empty array if getNftServiceData returns no results', async () => {
      const address: string = 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg';

      const state: AuctionStatus = AuctionStatus.running;
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(Promise.resolve(null));

      const expected: Auction[] = [];

      const actual = await service.getAccountAuctions(new QueryPagination(), address, state);

      expect(actual).toEqual(expected);
    });
  });

  describe('getAuctionId', () => {
    it('should return an auction details for a specific auctionId', async () => {
      const auctionId: number = 847035;

      const auction = {
        auctions: {
          edges: [
            {
              node: {
                id: '847035',
                identifier: 'Test-2d29f9-01',
                collection: 'Test-2d29f9',
                status: 'Running',
                type: 'Nft',
                creationDate: 1676576533,
                endDate: 1676585733,
                marketplace: { key: 'xoxno' },
                asset: {
                  creatorAddress: 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg',
                },
                minBid: { amount: '1900000000000000000', token: 'EGLD' },
                maxBid: { amount: '1900000000000000000', token: 'EGLD' },
                ownerAddress: 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg',
                marketplaceAuctionId: 586854,
                startDate: 1676576532,
              },
            },
          ],
        },
      };

      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(auction);

      const result = await service.getAuctionId(auctionId);

      expect(result).toEqual(expect.objectContaining({
        owner: 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg',
        identifier: 'Test-2d29f9-01',
        collection: 'Test-2d29f9',
        status: 'running',
        auctionType: 'Nft',
        createdAt: 1676576533,
        endsAt: 1676585733,
        marketplaceAuctionId: 586854,
        marketplace: 'xoxno',
        minBid: { amount: '1900000000000000000', token: 'EGLD' },
        maxBid: { amount: '1900000000000000000', token: 'EGLD' },
      }));
    });

    it('should throw a BadRequestException if result cannot be fetched', async () => {
      const auctionId = 1111;
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(null);

      await expect(service.getAuctionId(auctionId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAuctionsCount', () => {
    const mockResult = {
      auctions: {
        pageData: {
          count: 10,
        },
      },
    };

    it('should return the count of all auctions if no status is provided', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(mockResult);

      const result = await service.getAuctionsCount();
      expect(result).toStrictEqual(10);
    });

    it('should return the count of auctions with the specified status', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(mockResult);

      const result = await service.getAuctionsCount(AuctionStatus.running);
      expect(result).toStrictEqual(10);
    });

    it('should throw a BadRequestException if the GraphQL query returns no results', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(Promise.resolve(null));

      await expect(service.getAuctionsCount()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCollectionAuctionsCount', () => {
    const collection: string = 'Test-2d29f9';
    const mockResult = {
      auctions: {
        pageData: {
          count: 2109,
        },
      },
    };

    it('should return the count of running auctions for a specific collection', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(mockResult);

      const result = await service.getCollectionAuctionsCount(collection);
      expect(result).toStrictEqual(2109);
    });

    it('should throw a BadRequestException if the GraphQL query returns no results', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(Promise.resolve(null));

      await expect(service.getCollectionAuctionsCount(collection)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAccountAuctionsCount', () => {
    const collection: string = 'erd14wxx9p9kld06w66n6lcxcchv976n7crzma8w7s3tkaqcme8hr7fqdhhfdg';
    const mockResult = {
      auctions: {
        pageData: {
          count: 48,
        },
      },
    };

    it('should return the count of running auctions for a specific address', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(mockResult);

      const result = await service.getAccountAuctionsCount(collection);
      expect(result).toStrictEqual(48);
    });

    it('should throw a BadRequestException if the GraphQL query returns no results', async () => {
      jest.spyOn(graphQlService, 'getNftServiceData').mockResolvedValue(Promise.resolve(null));

      await expect(service.getAccountAuctionsCount(collection)).rejects.toThrow(BadRequestException);
    });
  });
});
