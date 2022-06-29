import { Jwt, JwtAuthenticateGuard } from "@elrondnetwork/nestjs-microservice-common";
import { BadRequestException, Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
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
  public async generateThumbnails(
    @Jwt('address') address: string,
    @Body() processNftRequest: ProcessNftRequest,
  ): Promise<{ [key: string]: boolean }> {
    try {
      return await this.processNftService.processWithOwnerCheck(address, processNftRequest);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
