import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Jwt } from "src/decorators/jwt";
import { JwtAuthenticateGuard } from "src/utils/guards/jwt.authenticate.guard";
import { ProcessNftRequest } from "./entities/process.nft.request";
import { ProcessNftsService } from "./process.nfts.service";

@Controller()
export class ProcessNftsPublicController {
  constructor(
    private readonly processNftService: ProcessNftsService,
  ) { }

  @UseGuards(JwtAuthenticateGuard)
  @Post("/nfts/process")
  @ApiOperation({ summary: 'Trigger NFT media/metadata reprocessing', description: 'Triggers NFT media/metadata reprocessing for collection owners' })
  @ApiResponse({ status: 201, description: 'NFT media/metadata reprocessing has been triggered' })
  @ApiResponse({ status: 429, description: 'Thumbnails have already been generated' })
  public async generateThumbnails(
    @Jwt('address') address: string,
    @Body() processNftRequest: ProcessNftRequest,
  ): Promise<{ [key: string]: boolean }> {
    return await this.processNftService.generateThumbnailsAsOwner(address, processNftRequest);
  }
}
