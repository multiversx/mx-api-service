import { forwardRef, Inject, Logger, Injectable } from '@nestjs/common';
import { ApiConfigService } from './api.config.service';
import { ApiService } from './api.service';
import { ExtrasApiScamTransactionResult, ExtrasApiTransactionMinInfoDto } from './external-dtos/extras-api';

@Injectable()
export class ExtrasApiService {
  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) {
    this.logger = new Logger(ExtrasApiService.name);
  }

  async get(url: string): Promise<any> {
    let result = await this.getRaw(url);
    return result.data.data;
  }

  async getRaw(url: string): Promise<any> {
    return await this.apiService.get(`${this.getServiceUrl()}/${url}`);
  }

  async create(url: string, data: any): Promise<any> {
    let result = await this.createRaw(url, data);
    return result.data.data;
  }

  async createRaw(url: string, data: any): Promise<any> {
    return await this.apiService.post(`${this.getServiceUrl()}/${url}`, data);
  }

  async checkScamTransaction(transactionMinInfoDto: ExtrasApiTransactionMinInfoDto): Promise<ExtrasApiScamTransactionResult | null> {
    try {
      const result: ExtrasApiScamTransactionResult = (await this.apiService.post(`${this.getServiceUrl()}/transactions/check-scam`, transactionMinInfoDto))?.data;
      return result;
    } catch (err) {
      this.logger.error('An error occurred while calling check scam transaction API.', {
        exception: err.toString(),
        txInfo: transactionMinInfoDto,
      });
      return null;
    }
  }

  private getServiceUrl(): string {
    return this.apiConfigService.getExtrasApiUrl();
  }
}