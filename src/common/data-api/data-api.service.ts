import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { DataApiToken } from "./entities/data-api.token";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class DataApiService {
  private readonly logger = new OriginLogger(DataApiService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
    private readonly cachingService: CacheService,
  ) { }

  public async getEgldPrice(timestamp?: number): Promise<number | undefined> {
    return await this.getEsdtTokenPrice('EGLD', timestamp);
  }

  public async getEsdtTokenPrice(identifier: string, timestamp?: number): Promise<number | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.DataApiTokenPrice(identifier, timestamp).key,
      async () => await this.getEsdtTokenPriceRaw(identifier, timestamp),
      CacheInfo.DataApiTokenPrice(identifier, timestamp).ttl
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
      const dateQuery = priceDate ? `&date=${priceDate}` : '';
      const priceUrl = `${this.apiConfigService.getDataApiServiceUrl()}/v1/quotes/${token.market}/${token.identifier}?extract=price${dateQuery}`;

      const response = await this.apiService.get(priceUrl);
      return response?.data;
    } catch (error) {
      this.logger.error(`An unexpected error occurred while fetching price for token ${identifier} from Data API.`);
      this.logger.error(error);
    }

    return undefined;
  }

  public async getDataApiToken(identifier: string): Promise<DataApiToken | undefined> {
    const tokens = await this.getDataApiTokens();
    return tokens[identifier];
  }

  public async getDataApiTokens(): Promise<Record<string, DataApiToken>> {
    return await this.cachingService.getOrSet(
      CacheInfo.DataApiTokens.key,
      async () => await this.getDataApiTokensRaw(),
      CacheInfo.DataApiTokens.ttl
    );
  }

  public async getDataApiTokensRaw(): Promise<Record<string, DataApiToken>> {
    if (!this.apiConfigService.isDataApiFeatureEnabled()) {
      return {};
    }

    try {
      const [cexTokensRaw, xExchangeTokensRaw, hatomTokensRaw, xoxnoTokensRaw] = await Promise.all([
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/v1/tokens/cex?fields=identifier`),
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/v1/tokens/xexchange?fields=identifier`),
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/v1/tokens/hatom?fields=identifier`),
        this.apiService.get(`${this.apiConfigService.getDataApiServiceUrl()}/v1/tokens/xoxno?fields=identifier`),
      ]);

      const cexTokens: DataApiToken[] = cexTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'cex' }));
      const xExchangeTokens: DataApiToken[] = xExchangeTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'xexchange' }));
      const hatomTokens: DataApiToken[] = hatomTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'hatom' }));
      const xoxnoTokens: DataApiToken[] = xoxnoTokensRaw.data.map((token: any) => new DataApiToken({ identifier: token.identifier, market: 'xoxno' }));
      const tokens = [...cexTokens, ...xExchangeTokens, ...hatomTokens, ...xoxnoTokens].toRecord<DataApiToken>(x => x.identifier);
      return tokens;
    } catch (error) {
      this.logger.error(`An unexpected error occurred while fetching tokens from Data API.`);
      this.logger.error(error);
      return {};
    }
  }
}
