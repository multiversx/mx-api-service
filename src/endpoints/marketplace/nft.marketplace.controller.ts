import { ParseAddressPipe, ParseCollectionPipe, ParseEnumPipe } from "@multiversx/sdk-nestjs-common";
import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { AccountAuctionStats } from "./entities/account.auction.stats";
import { Auction } from "./entities/account.auctions";
import { AuctionStatus } from "./entities/auction.status";
import { Auctions } from "./entities/auctions";
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
  async getAuctions(
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<Auctions[]> {
    return await this.nftMarketplaceService.getAuctions(
      new QueryPagination({ size }),
    );
  }

  @Get("/auctions/count")
  @ApiOperation({ summary: 'Auctions count', description: 'Returns all auctions count available on marketplaces ' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'status', description: 'Returns auctions count with specified status', required: false })
  async getAuctionsCount(
    @Query('status', new ParseEnumPipe(AuctionStatus)) status?: AuctionStatus,
  ): Promise<number> {
    return await this.nftMarketplaceService.getAuctionsCount(status);
  }

  @Get("/auctions/c")
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Auctions count', description: 'Returns all auctions count available on marketplaces ' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'status', description: 'Returns auctions count with specified status', required: false })
  async getAuctionsCountAlternative(
    @Query('status', new ParseEnumPipe(AuctionStatus)) status?: AuctionStatus,
  ): Promise<number> {
    return await this.nftMarketplaceService.getAuctionsCount(status);
  }

  @Get("/auctions/:id")
  @ApiOperation({ summary: 'Auction details', description: 'Returns auction details for a specific auction identifier ' })
  @ApiOkResponse({ type: Auctions })
  @ApiQuery({ name: 'auctionId', description: 'Auction identifier', required: true })
  async getAuctionId(
    @Param('id') id: number,
  ): Promise<Auction> {
    return await this.nftMarketplaceService.getAuctionId(id);
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
    @Param('address', ParseAddressPipe) address: string,
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

  @Get('/accounts/:address/auctions/count')
  @ApiOperation({ summary: 'Address auctions count', description: 'Returns total running auctions count for a specific address ' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'address', description: 'Account address', required: true })
  async getAccountAuctionsCount(
    @Param('address', ParseAddressPipe) address: string,
  ): Promise<number> {
    return await this.nftMarketplaceService.getAccountAuctionsCount(address);
  }

  @Get("/collections/:collection/auction/stats")
  @ApiOperation({ summary: 'Collection stats', description: 'Returns collection status details from nft marketplace for a given collection identifier' })
  @ApiOkResponse({ type: CollectionAuctionStats })
  async getCollectionStats(
    @Param('collection', ParseCollectionPipe) collection: string,
  ): Promise<CollectionAuctionStats> {
    return await this.nftMarketplaceService.getCollectionStats({ identifier: collection });
  }

  @Get('/collections/:collection/auctions')
  @ApiOperation({ summary: 'Collection auctions', description: 'Returns all auctions for a specific collection ' })
  @ApiOkResponse({ type: [Auctions] })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  @ApiQuery({ name: 'collection', description: 'Collection identifier', required: true })
  async getCollectionAuctions(
    @Param('collection', ParseCollectionPipe) collection: string,
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<Auctions[]> {
    return await this.nftMarketplaceService.getCollectionAuctions(new QueryPagination({ size }), collection);
  }

  @Get('/collections/:collection/auctions/count')
  @ApiOperation({ summary: 'Collection auctions count', description: 'Returns total running auctions count for a specific collection ' })
  @ApiOkResponse({ type: Number })
  @ApiQuery({ name: 'collection', description: 'Collection identifier', required: true })
  async getCollectionAuctionsCount(
    @Param('collection', ParseCollectionPipe) collection: string,
  ): Promise<number> {
    return await this.nftMarketplaceService.getCollectionAuctionsCount(collection);
  }
}
