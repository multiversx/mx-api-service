import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { MediaService } from "./media.service";

@Controller()
@ApiTags('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) { }

  @Get("/media/:uri(*)")
  async redirectToMediaUri(
    @Param('uri') uri: string,
    @Res() response: Response
  ) {
    const redirectUrl = await this.mediaService.getRedirectUrl(uri);
    if (!redirectUrl) {
      throw new NotFoundException('Not found');
    }

    response.statusMessage = 'Found';
    response.setHeader('location', redirectUrl);
    response.setHeader('cache-control', 'max-age=60');
    response.setHeader('Access-Control-Allow-Origin', '*');
    return response.redirect(301, redirectUrl);
  }
}
