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

  async post(route: string, data: any): Promise<any> {
    const url = this.getServiceUrl();
    if (!url) {
      return null;
    }

    return await this.apiService.post(`${url}/${route}`, data);
  }

  async checkScamTransaction(transactionMinInfoDto: ExtrasApiTransactionMinInfoDto): Promise<ExtrasApiScamTransactionResult | null> {
    if (!this.apiConfigService.getExtrasApiUrl()) {
      return null;
    }

    try {
      let result = await this.apiService.post(`${this.apiConfigService.getExtrasApiUrl()}/transactions/check-scam`, transactionMinInfoDto);
      return result?.data;
    } catch (err) {
      this.logger.error('An error occurred while calling check scam transaction API.', {
        exception: err.toString(),
        txInfo: transactionMinInfoDto,
      });
      return null;
    }
  }

  private getServiceUrl(): string | undefined {
    return this.apiConfigService.getExtrasApiUrl();
  }
}