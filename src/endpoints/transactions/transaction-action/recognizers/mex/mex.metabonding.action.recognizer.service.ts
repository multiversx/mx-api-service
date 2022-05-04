import { Injectable } from "@nestjs/common";
import BigNumber from "bignumber.js";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { BatchUtils } from "src/utils/batch.utils";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MetabondingWeek } from "./entities/metabonding.week";
import { MexFunction } from "./entities/mex.function.options";

@Injectable()
export class MetabondingActionRecognizerService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  recognize(metadata: TransactionMetadata): TransactionAction | undefined {
    const METABONDING_CONTRACT = this.apiConfigService.getMetabondingContractAddress();
    if (metadata.receiver !== METABONDING_CONTRACT) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.claimRewards:
        return this.getClaimRewardsAction(metadata);
      default:
        return undefined;
    }
  }

  private getClaimRewardsAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const args = metadata.functionArgs;
    if (!args) {
      return undefined;
    }

    const chunks = BatchUtils.splitArrayIntoChunks(args, 4);

    const metabondingWeeks: MetabondingWeek[] = [];
    for (const chunk of chunks) {
      const week = new MetabondingWeek();
      week.week = new BigNumber(`0x${chunk[0]}`).toNumber();

      let egldStakedHex = chunk[1];
      if (!egldStakedHex) {
        egldStakedHex = '00';
      }
      week.egld_staked = NumberUtils.toDenominatedString(BigInt(`0x${egldStakedHex}`));

      let lkmexStakedHex = chunk[2];
      if (!lkmexStakedHex) {
        lkmexStakedHex = '00';
      }
      week.lkmex_staked = NumberUtils.toDenominatedString(BigInt(`0x${lkmexStakedHex}`));

      metabondingWeeks.push(week);
    }

    const result = new TransactionAction();
    result.name = MexFunction.claimRewards;
    result.category = TransactionActionCategory.mex;
    result.description = `Eligible stake for ${metabondingWeeks.map((week) => `week ${week.week}: EGLD ${week.egld_staked}, LKMEX ${week.lkmex_staked}`).join(', ')}`;

    return result;
  }
}
