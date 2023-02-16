import { Test } from "@nestjs/testing";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NftMarketplaceService } from "src/endpoints/marketplace/nft.marketplace.service";
import { RootTestModule } from "src/test/root-test.module";

describe('Marketplace Service', () => {
  let service: NftMarketplaceService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RootTestModule],
      providers: [NftMarketplaceService],
    }).compile();

    service = moduleRef.get<NftMarketplaceService>(NftMarketplaceService);
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
  });
});
