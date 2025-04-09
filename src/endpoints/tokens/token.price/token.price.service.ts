import { Injectable } from "@nestjs/common";
import { TokenDetailed } from "../entities/token.detailed";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { NumberUtils } from "@multiversx/sdk-nestjs-common";
import { EsdtService } from "../../esdt/esdt.service";
import { DataApiService } from "src/common/data-api/data-api.service";
import { TokenAssetsPriceSourceType } from "src/common/assets/entities/token.assets.price.source.type";

@Injectable()
export class TokenPriceService {
  private readonly logger = new OriginLogger(TokenPriceService.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly esdtService: EsdtService,
    private readonly dataApiService: DataApiService,
  ) { }

  private extractData(data: any, path: string): any {
    const keys = path.split('.');
    let result: any = data;

    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined;
      }

      result = !isNaN(Number(key)) ? result[Number(key)] : result[key];
    }

    return result;
  }

  async fetchTokenDataFromUrl(url: string, path: string): Promise<any> {
    try {
      const result = await this.apiService.get(url);

      if (!result || !result.data) {
        this.logger.error(`Invalid response received from URL: ${url}`);
        return;
      }

      const extractedValue = this.extractData(result.data, path);
      if (!extractedValue) {
        this.logger.error(`No valid data found at URL: ${url}`);
        return;
      }

      return extractedValue;
    } catch (error) {
      this.logger.error(`Failed to fetch token data from URL: ${url}`, error);
    }
  }

  async getTokenPriceFromCustomUrl(url: string, path: string): Promise<any> {
    return await this.fetchTokenDataFromUrl(url, path);
  }

  async applyTokenPrices(tokens: TokenDetailed[]): Promise<void> {
    for (const token of tokens) {
      const priceSourcetype = token.assets?.priceSource?.type;

      if (priceSourcetype === TokenAssetsPriceSourceType.dataApi) {
        token.price = await this.dataApiService.getEsdtTokenPrice(token.identifier);
      } else if (priceSourcetype === TokenAssetsPriceSourceType.customUrl && token.assets?.priceSource?.url) {
        const pathToPrice = token.assets?.priceSource?.path ?? "0.usdPrice";
        const tokenData = await this.getTokenPriceFromCustomUrl(token.assets.priceSource.url, pathToPrice);

        if (tokenData) {
          token.price = tokenData;
        }
      }

      if (token.price) {
        const supply = await this.esdtService.getTokenSupply(token.identifier);
        token.supply = supply.totalSupply;
        token.circulatingSupply = supply.circulatingSupply;

        if (token.circulatingSupply) {
          token.marketCap = token.price * NumberUtils.denominateString(token.circulatingSupply, token.decimals);
        }
      }
    }
  }

  async getEgldPrice(): Promise<number> {
    const price = await this.dataApiService.getEgldPrice();
    return price ?? 0;
  }
} 
