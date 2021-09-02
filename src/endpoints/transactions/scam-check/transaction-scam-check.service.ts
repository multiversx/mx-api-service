import { Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api.config.service';
import { CachingService } from 'src/common/caching.service';
import { ExtrasApiScamTransactionResult, ExtrasApiTransactionMinInfoDto } from 'src/common/external-dtos/extras-api';
import { ExtrasApiService } from 'src/common/extras-api.service';
import { TransactionScamInfo } from '../entities/transaction-scam-info';
import { mapTransactionScamTypeFromExtrasApi, TransactionScamType } from '../entities/transaction-scam-type.enum';
import { TransactionDetailed } from '../entities/transaction.detailed';
import { PotentialScamTransactionChecker } from './potential-scam-transaction.checker';

@Injectable()
export class TransactionScamCheckService {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly extrasApiService: ExtrasApiService,
    private readonly potentialScamTransactionChecker: PotentialScamTransactionChecker,
  ) {
    this.logger = new Logger(TransactionScamCheckService.name);
  }

  async getScamInfo(transaction: TransactionDetailed): Promise<TransactionScamInfo | null> {
    try {
      if (!this.isScamCheckEnabled()) {
        return null;
      }

      if (!this.potentialScamTransactionChecker.check(transaction)) {
        return null;
      }

      const result = await this.loadScamTransactionResult(transaction);
      if (result === null) {
        return null;
      }
      return this.buildResult(result);
    } catch (err) {
      this.logger.error('An error occurred while getting scam info.', {
        exception: err.toString()
      });
      return null;
    }
  }

  private buildResult(result: ExtrasApiScamTransactionResult): TransactionScamInfo | null {
    const { type: extrasApiType, info } = result;
    const type = mapTransactionScamTypeFromExtrasApi(extrasApiType);

    if (type === TransactionScamType.none) {
      return null;
    }

    return {
      type,
      info
    };
  }

  private async loadScamTransactionResult(transaction: TransactionDetailed): Promise<ExtrasApiScamTransactionResult | null> {
    const input = this.buildExtrasApiTransactionMinInfoDto(transaction);
    return await this.cachingService.getOrSetCache(
      `scam-info.${transaction.txHash}.${input.hasScResults}`,
      () => this.extrasApiService.checkScamTransaction(input), 300, 300);
  }

  private buildExtrasApiTransactionMinInfoDto(transaction: TransactionDetailed): ExtrasApiTransactionMinInfoDto {
    return {
      data: transaction.data,
      hasScResults: transaction?.results?.length > 0,
      receiver: transaction.receiver,
      sender: transaction.sender,
      value: transaction.value,
    };
  }

  private isScamCheckEnabled(): boolean {
    return this.apiConfigService.getTransactionsScamCheck();
  }
}
