import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from 'src/common/caching.service';
import { ExtrasApiScamTransactionResult, ExtrasApiTransactionMinInfoDto } from 'src/common/external-dtos/extras-api';
import { ExtrasApiService } from 'src/common/extras-api.service';
import { Constants } from 'src/utils/constants';
import { TransactionScamInfo } from '../entities/transaction-scam-info';
import { mapTransactionScamTypeFromExtrasApi, TransactionScamType } from '../entities/transaction-scam-type.enum';
import { TransactionDetailed } from '../entities/transaction.detailed';
import { PotentialScamTransactionChecker } from './potential-scam-transaction.checker';

@Injectable()
export class TransactionScamCheckService {
  private readonly logger: Logger

  constructor(
    private readonly cachingService: CachingService,
    private readonly extrasApiService: ExtrasApiService,
    private readonly potentialScamTransactionChecker: PotentialScamTransactionChecker,
  ) {
    this.logger = new Logger(TransactionScamCheckService.name);
  }

  async getScamInfo(transaction: TransactionDetailed): Promise<TransactionScamInfo | undefined> {
    try {
      if (!this.potentialScamTransactionChecker.check(transaction)) {
        return;
      }

      const result = await this.loadScamTransactionResult(transaction);
      if (result === null) {
        return;
      }
      return this.buildResult(result);
    } catch (err: any) {
      this.logger.error('An error occurred while getting scam info.', {
        exception: err.toString()
      });
      return;
    }
  }

  private buildResult(result: ExtrasApiScamTransactionResult): TransactionScamInfo | undefined {
    const { type: extrasApiType, info } = result;
    const type = mapTransactionScamTypeFromExtrasApi(extrasApiType);

    if (type === TransactionScamType.none) {
      return;
    }

    return {
      type,
      info
    };
  }

  private async loadScamTransactionResult(transaction: TransactionDetailed): Promise<ExtrasApiScamTransactionResult | null> {
    const input = this.buildExtrasApiTransactionMinInfoDto(transaction);
    return await this.cachingService.getOrSetCache(
      `scam-info.${transaction.txHash}`,
      () => this.extrasApiService.checkScamTransaction(input), Constants.oneMinute() * 5);
  }

  private buildExtrasApiTransactionMinInfoDto(transaction: TransactionDetailed): ExtrasApiTransactionMinInfoDto {
    return {
      data: transaction.data,
      receiver: transaction.receiver,
      sender: transaction.sender,
      value: transaction.value,
    };
  }
}
