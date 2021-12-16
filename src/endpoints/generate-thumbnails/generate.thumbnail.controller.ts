import { Controller, Get, Param, Query } from "@nestjs/common";
import { GenerateThumbnailService } from "./generate.thumbnail.service";

@Controller()
export class GenerateThumbnailController {
  constructor(
    private readonly generateThumbnailService: GenerateThumbnailService
  ) { }

  @Get("/generate-thumbnails")
  async generateThumbnails(
    @Query('collection') collection?: string,
  ): Promise<string> {
    await this.generateThumbnailService.generateThumbnails(collection);

    return 'Thumbnails generated for 10000 nfts';
  }

  @Get("/generate-thumbnails/:identifier")
  async generateThumbnailsForNft(
    @Param('identifier') nftIdentifier: string,
  ): Promise<string> {
    await this.generateThumbnailService.generateThumbnailsForNft(nftIdentifier);

    return `Thumbnails generated for nft ${nftIdentifier}`;
  }
}