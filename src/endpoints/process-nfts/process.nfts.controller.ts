import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { GenerateThumbnailRequest } from "./entities/generate.thumbnail.request";
import { ProcessNftsService } from "./process.nfts.service";

@Controller()
export class ProcessNftsController {
  constructor(
    private readonly generateThumbnailService: ProcessNftsService
  ) { }

  @Post("/nfts/process")
  async generateThumbnails(
    @Body() generateRequest: GenerateThumbnailRequest,
  ): Promise<void> {
    if (generateRequest.collection) {
      await this.generateThumbnailService.processCollection(generateRequest.collection);
    } else if (generateRequest.identifier) {
      await this.generateThumbnailService.processNft(generateRequest.identifier);
    } else {
      throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }
  }
}