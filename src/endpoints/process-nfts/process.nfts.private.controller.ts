import { Body, Controller, Post } from "@nestjs/common";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftsService } from "./process.nfts.service";

@Controller()
export class ProcessNftsPrivateController {
  constructor(
    private readonly processNftService: ProcessNftsService,
  ) { }

  @Post("/nfts/process")
  async generateThumbnails(
    @Body() processNftRequest: ProcessNftRequest,
  ): Promise<{ [key: string]: boolean }> {
    return await this.processNftService.generateThumbnails(processNftRequest);
  }
}
