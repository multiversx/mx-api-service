import { Controller, DefaultValuePipe, Get, NotFoundException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Auctions } from "./entities/auctions";
import { ExploreCollectionsStats } from "./entities/explore.collections.stats";
import { ExploreNftsStats } from "./entities/explore.nfts.stats";
import { ExploreStats } from "./entities/explore.stats";
import { NftMarketplaceService } from "./marketplace.service";

@Controller()
@ApiTags('marketplace')
export class NftMarketplaceController {
  constructor(
    private readonly nftMarketplaceService: NftMarketplaceService
  ) { }

  @Get("/explore/auctions")
  @ApiOperation({ summary: 'Explore auctions', description: 'Returns auctions available in marketplaces ' })
  @ApiOkResponse({ type: [Auctions] })
  @ApiQuery({ name: 'size', description: 'Number of items to retrieve', required: false })
  getAuctions(
    @Query("size", new DefaultValuePipe(25), ParseIntPipe) size: number,
  ): Promise<Auctions[]> {
    return this.nftMarketplaceService.getAuctions(new QueryPagination({ size: size }));
  }

  @Get("/explore/auctions/:id")
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


  @Get("/explore/stats")
  @ApiOperation({ summary: 'Explore stats', description: 'Returns general information count about artist, collections, nfts ' })
  @ApiOkResponse({ type: ExploreStats })
  getExploreStats(
  ): Promise<ExploreStats> {
    return this.nftMarketplaceService.getExploreStats();
  }

  @Get("/explore/nfts/stats")
  @ApiOperation({ summary: 'Explore Nfts stats', description: 'Returns general nfts stats details' })
  @ApiOkResponse({ type: ExploreNftsStats })
  getExploreNftsStats(
  ): Promise<ExploreNftsStats> {
    return this.nftMarketplaceService.getExploreNftsStats();
  }

  @Get("/explore/collections/stats")
  @ApiOperation({ summary: 'Explore Collections stats', description: 'Returns verified collections count and most active collections in last 30 days' })
  @ApiOkResponse({ type: ExploreCollectionsStats })
  getExploreCollectionsStats(
  ): Promise<ExploreCollectionsStats> {
    return this.nftMarketplaceService.getExploreCollectionsStats();
  }
}
