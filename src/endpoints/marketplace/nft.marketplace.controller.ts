import { ParseAddressPipe, ParseEnumPipe } from "@multiversx/sdk-nestjs";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AccountAuctionStats } from "./entities/account.auction.stats";
import { Auction } from "./entities/account.auctions";
import { AuctionStatus } from "./entities/auction.status";
import { Auctions } from "./entities/auctions";
import { AuctionsFilter } from "./entities/auctions.filter";
import { CollectionAuctionStats } from "./entities/collection.auction.stats";
import { NftMarketplaceService } from "./nft.marketplace.service";

@Controller()
@ApiTags('marketplace')
export class NftMarketplaceController {
  constructor(
    private readonly nftMarketplaceService: NftMarketplaceService,
  ) { }

  @Get("/auctions")
  @ApiOperation({ summary: 'Explore auctions', description: 'Returns auctions available in marketplaces ' })
  @ApiOkResponse({ type: [Auctions] })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getAuctions(
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<Auctions[]> {
    return this.nftMarketplaceService.getAuctionsRaw(
      new QueryPagination({ size }),
    );
  }

  @Get("/auctions/count")
  @ApiOperation({ summary: 'Auctions count', description: 'Return total number of available auctions' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'marketplace', description: 'Search by marketplace name', required: false })
  async getTokenCount(
    @Query('marketplace') marketplace?: string,
  ): Promise<number> {
    return await this.nftMarketplaceService.getAuctionsCount(new AuctionsFilter({ marketplace }));
  }

  @Get("/auctions/c")
  @ApiExcludeEndpoint()
  async getTokenCountAlternative(
    @Query('marketplace') marketplace?: string,
  ): Promise<number> {
    return await this.nftMarketplaceService.getAuctionsCount(new AuctionsFilter({ marketplace }));
  }

  @Get("/auctions/:id")
  @ApiOperation({ summary: 'Explore auction details', description: 'Returns a specific auction ' })
  @ApiOkResponse({ type: Auctions })
  async getAuctionById(
    @Param("id") id: string,
  ): Promise<Auctions> {
    const auction = await this.nftMarketplaceService.getAuctionById(id);
    if (auction === undefined) {
      throw new NotFoundException('Auction not found');
    }
    return auction;
  }

  @Get("/accounts/:address/auction/stats")
  @ApiOperation({ summary: 'Account stats', description: 'Returns account status details from nft marketplace for a given address' })
  @ApiOkResponse({ type: AccountAuctionStats })
  async getAccountStats(
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<AccountAuctionStats> {
    const account = await this.nftMarketplaceService.getAccountStats(address);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  @Get("/accounts/:address/auctions")
  @ApiOperation({ summary: 'Account auctions', description: 'Returns account auctions for a given address' })
  @ApiQuery({ name: 'from', description: 'Number of items to skip for the result set', required: false })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'status', description: 'Returns auctions with specified status', required: false })
  @ApiOkResponse({ type: Auction })
  async getAccountAuctions(
    @Param('address') address: string,
    @Query('from', new DefaultValuePipe(0), ParseIntPipe) from: number,
    @Query('size', new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query('status', new ParseEnumPipe(AuctionStatus)) status?: AuctionStatus,
  ): Promise<Auction[]> {
    const account = await this.nftMarketplaceService.getAccountAuctions(new QueryPagination({ from, size }), address, status);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  @Get("/collections/:collection/auction/stats")
  @ApiOperation({ summary: 'Collection stats', description: 'Returns collection status details from nft marketplace for a given collection identifier' })
  @ApiOkResponse({ type: CollectionAuctionStats })
  async getCollectionStats(
    @Param('collection') collection: string,
  ): Promise<CollectionAuctionStats> {
    const collectionStats = await this.nftMarketplaceService.getCollectionStats({ identifier: collection });
    if (!collectionStats) {
      throw new NotFoundException('Could not fetch collection stats');
    }

    return collectionStats;
  }
}
