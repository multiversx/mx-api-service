import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftSettings } from "./entities/process.nft.settings";
import { ProcessNftsService } from "./process.nfts.service";

@Controller()
export class ProcessNftsController {
  constructor(
    private readonly processNftService: ProcessNftsService,
  ) { }

  @Post("/nfts/process")
  async generateThumbnails(
    @Body() processNftRequest: ProcessNftRequest,
  ): Promise<{ [key: string]: boolean }> {
    const settings: ProcessNftSettings = {
      forceRefreshMedia: processNftRequest.forceRefreshMedia ?? false,
      forceRefreshMetadata: processNftRequest.forceRefreshMetadata ?? false,
      forceRefreshThumbnail: processNftRequest.forceRefreshThumbnail ?? false,
      skipRefreshThumbnail: processNftRequest.skipRefreshThumbnail ?? false,
    };

    if (processNftRequest.collection) {
      return await this.processNftService.processCollection(processNftRequest.collection, settings);
    } else if (processNftRequest.identifier) {
      const processed = await this.processNftService.processNft(processNftRequest.identifier, settings);

      const result: { [key: string]: boolean } = {};
      result[processNftRequest.identifier] = processed;

      return result;
    } else {
      throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }
  }
}
