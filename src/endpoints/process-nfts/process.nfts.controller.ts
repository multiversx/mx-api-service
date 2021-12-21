import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftSettings } from "./entities/process.nft.settings";
import { ProcessNftsService } from "./process.nfts.service";

@Controller()
export class ProcessNftsController {
  constructor(
    private readonly generateThumbnailService: ProcessNftsService
  ) { }

  @Post("/nfts/process")
  async generateThumbnails(
    @Body() generateRequest: ProcessNftRequest,
  ): Promise<void> {
    let settings: ProcessNftSettings = {
      forceRefreshMedia: generateRequest.forceRefreshMedia ?? false,
      forceRefreshMetadata: generateRequest.forceRefreshMetadata ?? false,
      forceRefreshThumbnail: generateRequest.forceRefreshThumbnail ?? false,
      skipRefreshThumbnail: generateRequest.skipRefreshThumbnail ?? false
    }

    if (generateRequest.collection) {
      await this.generateThumbnailService.processCollection(generateRequest.collection, settings);
    } else if (generateRequest.identifier) {
      await this.generateThumbnailService.processNft(generateRequest.identifier, settings);
    } else {
      throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }
  }
}