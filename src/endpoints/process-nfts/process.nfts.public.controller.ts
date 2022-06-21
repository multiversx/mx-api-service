import { Body, Controller, Post, UseGuards } from "@nestjs/common";
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
  public async generateThumbnails(
    @Jwt('address') address: string,
    @Body() processNftRequest: ProcessNftRequest,
  ): Promise<{ [key: string]: boolean }> {
    return await this.processNftService.generateThumbnailsAsOwner(address, processNftRequest);
  }
}
