import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NftMarketplaceService } from "../marketplace.service";
import { ExploreCollectionsStats } from "./explore.collections.stats";
import { ExploreNftsStats } from "./explore.nfts.stats";

@Controller()
@ApiTags('marketplace')
export class NftMarketplaceController {
  constructor(
    private readonly nftMarketplaceService: NftMarketplaceService
  ) { }

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
