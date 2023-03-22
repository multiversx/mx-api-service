import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiService, CachingService, OriginLogger } from "@multiversx/sdk-nestjs";
import { DataApiToken } from "./entities/data-api.token";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class DataApiService {
  private readonly logger = new OriginLogger(DataApiService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cachingService: CachingService,
  ) { }

  public async getEgldPrice(timestamp?: number): Promise<number | undefined> {
    return await this.getEsdtTokenPrice('EGLD', timestamp);
  }

  public async getEsdtTokenPrice(identifier: string, timestamp?: number): Promise<number | undefined> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.HistoricalPrice(identifier, timestamp).key,
      async () => await this.getEsdtTokenPriceRaw(identifier, timestamp),
      CacheInfo.HistoricalPrice(identifier, timestamp).ttl
    );
  }

  private async getEsdtTokenPriceRaw(identifier: string, timestamp?: number): Promise<number | undefined> {
    if (!this.apiConfigService.isDataApiFeatureEnabled()) {
      return undefined;
    }

    const token = await this.getDataApiToken(identifier);
    if (!token) {
      return undefined;
    }

    try {
      const priceDate = timestamp ? new Date(timestamp * 1000).toISODateString() : undefined;
      const priceUrl = `${this.apiConfigService.getDataApiServiceUrl()}/quotes/${token.market}/${token.identifier}${priceDate ? `?date=${priceDate}` : ''}`;

      const response = await this.apiService.get(priceUrl);
      return response?.data?.price;
    } catch (error) {
      this.logger.error(`An unexpected error occurred while fetching price for token ${identifier} from Data API.`);
      this.logger.error(error);
    }

    return undefined;
  }

  private async getDataApiToken(identifier: string): Promise<DataApiToken | undefined> {
    const tokens = await this.getDataApiTokens();
    const token = tokens.find(x => x.identifier === identifier);
    return token;
  }

  private async getDataApiTokens(): Promise<DataApiToken[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.DataApiTokens.key,
      async () => await this.getDataApiTokensRaw(),
      CacheInfo.DataApiTokens.ttl
    );
  }

  private async getDataApiTokensRaw(): Promise<DataApiToken[]> {
    if (!this.apiConfigService.isDataApiFeatureEnabled()) {
      return [];
    }

    try {
      const [cexTokensRaw, xExchangeTokensRaw] = await Promise.all([
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/tokens/cex`),
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/tokens/xexchange`),
      ]);

      const cexTokens = cexTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'cex' }));
      const xExchangeTokens = xExchangeTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'xexchange' }));

      const tokens = [...cexTokens, ...xExchangeTokens];
      return tokens;
    } catch (error) {
      this.logger.error(`An unexpected error occurred while fetching tokens from Data API.`);
      this.logger.error(error);
    }

    return [];
  }
}
