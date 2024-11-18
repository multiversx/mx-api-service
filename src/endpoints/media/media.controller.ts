import { Controller, Get, Param, Res } from "@nestjs/common";
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
  redirectToMediaUri(
    @Param('uri') uri: string,
    @Res() response: Response
  ) {
    const redirectUrl = this.mediaService.getRedirectUrl(uri);
    if (!redirectUrl) {
      return response.status(204);
    }

    return response.redirect(redirectUrl);
  }
}
