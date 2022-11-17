import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Auctions } from "./entities/auctions";
import { AuctionsFilter } from "./entities/auctions.filter";
import { NftMarketplaceService } from "./marketplace.service";

@Controller()
@ApiTags('marketplace')
export class NftMarketplaceController {
  constructor(
    private readonly nftMarketplaceService: NftMarketplaceService
  ) { }

  @Get("/auctions")
  @ApiOperation({ summary: 'Explore auctions', description: 'Returns auctions available in marketplaces ' })
  @ApiOkResponse({ type: [Auctions] })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getAuctions(
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
    @Query("marketplace") marketplace: string,
  ): Promise<Auctions[]> {
    return this.nftMarketplaceService.getAuctions(
      new QueryPagination({ size }),
      new AuctionsFilter({ marketplace }));
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
}
