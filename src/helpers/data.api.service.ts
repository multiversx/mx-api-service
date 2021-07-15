import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { DataQuoteType } from "./entities/data.quote.type";

@Injectable()
export class DataApiService {
  private readonly quotesHistoricalLatestUrl: string;
  private readonly stakingUsersHistoricalUrl: string;


  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.quotesHistoricalLatestUrl = `${this.apiConfigService.getDataLatestUrl()}/quoteshistorical/egld`;
    this.stakingUsersHistoricalUrl = `${this.apiConfigService.getDataLatestUrl()}/stakinghistorical/total`;
  };

  async getQuotesHistoricalTimestamp(type: DataQuoteType, timestamp: number): Promise<number> {
    const { data } = await this.apiService.get(`https://data.elrond.com/closing/quoteshistorical/egld/${type}/${timestamp}`);

    return data;
  }

  async getQuotesHistoricalLatest(type: DataQuoteType): Promise<number> {
    const { data } = await this.apiService.get(`${this.quotesHistoricalLatestUrl}/${type}`);

    return data;
  }

  async getStakingUsersHistorical(stakeUrl: string): Promise<number> {
    const { data } = await this.apiService.get(`${this.stakingUsersHistoricalUrl}/${stakeUrl}`);

    return data;
  }
}