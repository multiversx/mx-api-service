import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NftMarketplaceService } from "../marketplace.service";
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
  getAccounts(
  ): Promise<ExploreNftsStats> {
    return this.nftMarketplaceService.getExploreNftsStats();
  }
}
