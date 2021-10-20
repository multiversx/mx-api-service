import { Injectable, Logger } from '@nestjs/common';
import { CachingService } from 'src/common/caching/caching.service';
import { TransactionScamResult } from 'src/common/external/entities/transaction.scam.result';
import { TransactionScamMinInfo } from 'src/common/external/entities/transaction.scam.min.info';
import { ExtrasApiService } from 'src/common/external/extras.api.service';
import { Constants } from 'src/utils/constants';
import { TransactionScamInfo } from '../entities/transaction.scam.info';
import { TransactionDetailed } from '../entities/transaction.detailed';
import { PotentialScamTransactionChecker } from './potential.scam.transaction.checker';
import { TransactionScamType } from 'src/common/external/entities/transaction.scam.type';

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

  private buildResult(result: TransactionScamResult): TransactionScamInfo | undefined {
    const { type, info } = result;

    if (type === TransactionScamType.none) {
      return;
    }

    return {
      type,
      info
    };
  }

  private async loadScamTransactionResult(transaction: TransactionDetailed): Promise<TransactionScamResult | null> {
    const input = this.buildExtrasApiTransactionMinInfoDto(transaction);
    return await this.cachingService.getOrSetCache(
      `scam-info.${transaction.txHash}`,
      () => this.extrasApiService.checkScamTransaction(input), Constants.oneMinute() * 5);
  }

  private buildExtrasApiTransactionMinInfoDto(transaction: TransactionDetailed): TransactionScamMinInfo {
    return {
      data: transaction.data,
      receiver: transaction.receiver,
      sender: transaction.sender,
      value: transaction.value,
    };
  }
}
