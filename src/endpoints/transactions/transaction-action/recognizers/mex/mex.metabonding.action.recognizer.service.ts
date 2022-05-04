import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { BatchUtils } from "src/utils/batch.utils";
import { BinaryUtils } from "src/utils/binary.utils";
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
      week.week = BinaryUtils.hexToNumber(chunk[0]);
      week.egldStaked = BinaryUtils.hexToBigInt(chunk[1]).toString();
      week.lkmexStaked = BinaryUtils.hexToBigInt(chunk[2]).toString();

      metabondingWeeks.push(week);
    }

    const result = new TransactionAction();
    result.name = MexFunction.claimRewards;
    result.category = TransactionActionCategory.mex;
    result.description = `Eligible stake for ${metabondingWeeks.map((week) => `week ${week.week}: EGLD ${NumberUtils.toDenominatedString(BigInt(week.egldStaked))}, LKMEX ${NumberUtils.toDenominatedString(BigInt(week.lkmexStaked))}`).join('; ')}`;
    result.arguments = {
      weeks: metabondingWeeks,
      functionName: metadata.functionName,
      functionArgs: metadata.functionArgs,
    };

    return result;
  }
}
