import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { DataQuoteType } from "./entities/data.quote.type";
import { ApiService } from "../network/api.service";

@Injectable()
export class DataApiService {
  private readonly dataUrl: string | undefined;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.dataUrl = this.apiConfigService.getDataUrl();
  };

  async getQuotesHistoricalTimestamp(type: DataQuoteType, timestamp: number): Promise<number | undefined> {
    if (!this.dataUrl) {
      return undefined;
    }

    const { data } = await this.apiService.get(`${this.dataUrl}/closing/quoteshistorical/egld/${type}/${timestamp}`);

    return data;
  }

  async getQuotesHistoricalLatest(type: DataQuoteType): Promise<number | undefined> {
    if (!this.dataUrl) {
      return undefined;
    }

    const { data } = await this.apiService.get(`${this.dataUrl}/latest/quoteshistorical/egld/${type}`);

    return data;
  }
}