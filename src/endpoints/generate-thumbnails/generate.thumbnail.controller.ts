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
  ): Promise<void> {
    if (generateRequest.collection) {
      await this.generateThumbnailService.generateThumbnails(generateRequest.collection);
    } else if (generateRequest.identifier) {
      await this.generateThumbnailService.generateThumbnailsForNft(generateRequest.identifier);
    } else {
      throw new HttpException('Provide an identifier or a collection to generate thumbnails for', HttpStatus.BAD_REQUEST);
    }
  }
}