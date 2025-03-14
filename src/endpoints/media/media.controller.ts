import { Controller, Get, InternalServerErrorException, NotFoundException, Param, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { MediaService } from "./media.service";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Controller()
@ApiTags('media')
export class MediaController {
  private readonly logger = new OriginLogger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly apiService: ApiService,
  ) { }

  @Get("/media/:uri(*)")
  async redirectToMediaUri(
    @Param('uri') uri: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const redirectUrl = await this.mediaService.getRedirectUrl(uri);
    if (!redirectUrl) {
      throw new NotFoundException('Not found');
    }

    try {
      const response = await this.apiService.get(redirectUrl, {
        // @ts-ignore
        responseType: 'stream',
        timeout: 60_000, // 60 seconds timeout
      });

      res.setHeader('content-type', response.headers['content-type']);
      res.setHeader('content-length', response.headers['content-length']);
      res.setHeader('cache-control', 'max-age=60');
      res.setHeader('Access-Control-Allow-Origin', '*');

      response.data.pipe(res);

      response.data.on('error', (error: any) => {
        this.logger?.error(`Error streaming the resource: ${redirectUrl}`);
        this.logger?.error(error);

        throw new InternalServerErrorException('Failed to fetch URL');
      });

      req.on('close', () => {
        response.data?.destroy();
      });

      return;
    } catch (error) {
      this.logger.error(`Failed to fetch URL: ${redirectUrl}`);

      throw new InternalServerErrorException('Failed to fetch URL');
    }
  }
}
