import { ApiService, OriginLogger } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { DataQuoteType } from "./entities/data.quote.type";

@Injectable()
export class DataApiService {
  private readonly dataUrl: string | undefined;
  private readonly logger = new OriginLogger(DataApiService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.dataUrl = this.apiConfigService.getDataUrl();
  }

  async getQuotesHistoricalTimestamp(type: DataQuoteType, timestamp: number): Promise<number | undefined> {
    if (!this.dataUrl) {
      return undefined;
    }

    try {
      const { data } = await this.apiService.get(`${this.dataUrl}/closing/quoteshistorical/egld/${type}/${timestamp}`);

      return data;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when fetching historical latest quote for '${type}' and timestamp '${timestamp}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getQuotesHistoricalLatest(type: DataQuoteType): Promise<number | undefined> {
    if (!this.dataUrl) {
      return undefined;
    }

    try {
      const { data } = await this.apiService.get(`${this.dataUrl}/latest/quoteshistorical/egld/${type}`);

      return data;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when fetching historical latest quote for '${type}'`);
      this.logger.error(error);
      return undefined;
    }
  }
}
