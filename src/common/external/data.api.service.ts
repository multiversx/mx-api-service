import { ApiService, OriginLogger } from "@elrondnetwork/erdnest";
import { NativeAuthSigner } from "@elrondnetwork/erdnest/lib/src/utils/native.auth.signer";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { DataQuoteType } from "./entities/data.quote.type";

@Injectable()
export class DataApiService {
  private readonly dataApiUrl: string | undefined;
  private readonly logger = new OriginLogger(DataApiService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.dataApiUrl = this.apiConfigService.getDataApiUrl();
  }

  public async query(query: string): Promise<any> {
    if (!this.dataApiUrl) {
      return undefined;
    }

    try {
      const result = await this.apiService
        .post(
          this.dataApiUrl,
          { query },
          {
            nativeAuthSigner: new NativeAuthSigner({
              apiUrl: this.apiConfigService.getApiUrl(),
              signerPrivateKeyPath: this.apiConfigService.getSignerPrivateKeyPath(),
            }
            ),
          }
        )
        .then(response => response.data);

      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getQuotesHistoricalTimestamp(type: DataQuoteType, timestamp: number): Promise<number | undefined> {
    if (!this.dataApiUrl) {
      return undefined;
    }

    try {
      const { data } = await this.query(`query{
        quotes{
          historical(identifier: "EGLD"){
            ${type}(query:{
              date: ${timestamp}
            }){
              last
            }
          }
        }
      }`);

      return data;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when fetching historical latest quote for '${type}' and timestamp '${timestamp}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getQuotesHistoricalLatest(type: DataQuoteType): Promise<number | undefined> {
    if (!this.dataApiUrl) {
      return undefined;
    }

    try {
      const { data } = await this.query(`query{
        quotes{
          latest(identifier: "EGLD"){
            ${type}
        }
       }
      }`);

      return data;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when fetching historical latest quote for '${type}'`);
      this.logger.error(error);
      return undefined;
    }
  }
}
