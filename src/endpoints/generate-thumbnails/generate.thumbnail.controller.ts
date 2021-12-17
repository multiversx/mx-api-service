import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { GenerateThumbnailRequest } from "./entities/generate.thumbnail.request";
import { GenerateThumbnailService } from "./generate.thumbnail.service";

@Controller()
export class GenerateThumbnailController {
  constructor(
    private readonly generateThumbnailService: GenerateThumbnailService
  ) { }

  @Post("/generate-thumbnails")
  async generateThumbnails(
    @Body() generateRequest: GenerateThumbnailRequest,
  ): Promise<string> {

    if (generateRequest.collection) {
      await this.generateThumbnailService.generateThumbnails(generateRequest.collection);

      return `Generate thumbnails jobs for collection ${generateRequest.collection} started!`;
    }
    if (generateRequest.identifier) {
      await this.generateThumbnailService.generateThumbnailsForNft(generateRequest.identifier);

      return `Generate thumbnails jobs for nft ${generateRequest.identifier} started!`;
    }

    throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
  }
}