import { Injectable } from "@nestjs/common";
import { GraphQlService } from "src/common/graphql/graphql.service";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { gql } from 'graphql-request';
import { MexTokenChart } from "./entities/mex.token.chart";
import { MexTokenService } from "./mex.token.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { tokenPricesHourResolutionQuery } from "./graphql/token.prices.hour.resolution.query";

@Injectable()
export class MexTokenChartsService {
  private readonly logger = new OriginLogger(MexTokenChartsService.name);

  constructor(
    private readonly graphQlService: GraphQlService,
    private readonly mexTokenService: MexTokenService,
    private readonly cachingService: CacheService,
  ) { }

  async getTokenPricesHourResolution(tokenIdentifier: string): Promise<MexTokenChart[] | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenHourChart(tokenIdentifier).key,
      async () => await this.getTokenPricesHourResolutionRaw(tokenIdentifier),
      CacheInfo.TokenHourChart(tokenIdentifier).ttl,
    );
  }

  async getTokenPricesHourResolutionRaw(tokenIdentifier: string): Promise<MexTokenChart[] | undefined> {
    const isMexToken = await this.isMexToken(tokenIdentifier);
    if (!isMexToken) {
      return undefined;
    }

    try {
      const query = tokenPricesHourResolutionQuery(tokenIdentifier);
      const data = await this.graphQlService.getExchangeServiceData(query);
      return this.convertToMexTokenChart(data?.values24h) || [];
    } catch (error) {
      this.logger.error(`An error occurred while fetching hourly token prices for ${tokenIdentifier}`, error);
      return [];
    }
  }

  async getTokenPricesDayResolution(tokenIdentifier: string): Promise<MexTokenChart[] | undefined> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenDailyChart(tokenIdentifier).key,
      async () => await this.getTokenPricesDayResolutionRaw(tokenIdentifier),
      CacheInfo.TokenDailyChart(tokenIdentifier).ttl,
    );
  }

  async getTokenPricesDayResolutionRaw(tokenIdentifier: string): Promise<MexTokenChart[] | undefined> {
    const isMexToken = await this.isMexToken(tokenIdentifier);
    if (!isMexToken) {
      return undefined;
    }

    const query = gql`
      query tokenPriceDayResolution {
        latestCompleteValues(
          series: "${tokenIdentifier}",
          metric: "priceUSD",
        ) {
          timestamp
          value
        }
      }
    `;

    try {
      const data = await this.graphQlService.getExchangeServiceData(query);
      return this.convertToMexTokenChart(data?.latestCompleteValues) || [];
    } catch (error) {
      this.logger.error(`An error occurred while fetching daily token prices for ${tokenIdentifier}`, error);
      return [];
    }
  }

  private convertToMexTokenChart(data: { timestamp: string; value: string }[]): MexTokenChart[] {
    return data?.map(item => new MexTokenChart({
      timestamp: Math.floor(new Date(item.timestamp).getTime() / 1000),
      value: Number(item.value),
    })) || [];
  }

  private async isMexToken(tokenIdentifier: string): Promise<boolean> {
    const token = await this.mexTokenService.getMexTokenByIdentifier(tokenIdentifier);
    return token !== undefined;
  }
}
