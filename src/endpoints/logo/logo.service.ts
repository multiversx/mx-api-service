import { Injectable } from "@nestjs/common";
import { AssetsService } from "src/common/assets/assets.service";
import { Logo } from "./entities/logo";

@Injectable()
export class LogoService {
  constructor(
    private readonly assetsService: AssetsService
  ) { }

  private async getLogo(identifier: string): Promise<Logo | undefined> {
    const assets = await this.assetsService.getAssets(identifier);
    if (!assets) {
      return;
    }

    return new Logo({ pngUrl: assets.pngUrl, svgUrl: assets.svgUrl });
  }

  async getLogoPng(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.pngUrl;
  }

  async getLogoSvg(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.svgUrl;
  }
}
