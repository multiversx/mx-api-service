import { ParseTokenPipe } from "@elrondnetwork/erdnest";
import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { LogoService } from "./logo.service";

@Controller()
export class LogoController {
  constructor(private readonly logoService: LogoService) { }

  @Get('/logo/:identifier/png')
  async getTokenLogoPng(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const url = await this.logoService.getLogoPng(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }

  @Get('/logo/:identifier/svg')
  async getTokenLogoSvg(
    @Param('identifier', ParseTokenPipe) identifier: string,
    @Res() response: Response
  ): Promise<void> {
    const url = await this.logoService.getLogoSvg(identifier);
    if (url === undefined) {
      throw new NotFoundException('Assets not found');
    }

    response.redirect(url);
  }
}
