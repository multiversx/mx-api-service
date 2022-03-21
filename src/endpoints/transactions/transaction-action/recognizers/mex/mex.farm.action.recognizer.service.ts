import { Injectable } from "@nestjs/common";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionEsdtNftRecognizerService } from "../esdt/transaction.action.esdt.nft.recognizer.service";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";

@Injectable()
export class MexFarmActionRecognizerService {
  constructor(
    private readonly transactionActionEsdtNftRecognizerService: TransactionActionEsdtNftRecognizerService,
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (!settings.farmContracts.includes(metadata.receiver)) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.enterFarm:
      case MexFunction.enterFarmProxy:
        return this.getFarmAction(metadata, MexFunction.enterFarm, 'Enter farm with');
      case MexFunction.enterFarmAndLockRewards:
      case MexFunction.enterFarmAndLockRewardsProxy:
        return this.getFarmAction(metadata, MexFunction.enterFarm, 'Enter farm and lock rewards with');
      case MexFunction.exitFarm:
      case MexFunction.exitFarmProxy:
        return this.getFarmAction(metadata, MexFunction.exitFarm, 'Exit farm with');
      case MexFunction.claimRewards:
      case MexFunction.claimRewardsProxy:
        return this.getFarmAction(metadata, MexFunction.claimRewards, 'Claim rewards for');
      case MexFunction.compoundRewards:
      case MexFunction.compoundRewardsProxy:
        return this.getFarmAction(metadata, MexFunction.compoundRewards, 'Reinvest rewards for');
      case MexFunction.stakeFarm:
      case MexFunction.stakeFarmProxy:
        return this.getFarmAction(metadata, MexFunction.enterFarm, 'Stake farm with');
      case MexFunction.stakeFarmTokens:
      case MexFunction.stakeFarmTokensProxy:
        return this.getFarmAction(metadata, MexFunction.enterFarm, 'Stake farm tokens with');
      case MexFunction.unstakeFarm:
      case MexFunction.unstakeFarmProxy:
        return this.getFarmAction(metadata, MexFunction.exitFarm, 'Unstake farm with');
      case MexFunction.unstakeFarmTokens:
      case MexFunction.unstakeFarmTokensProxy:
        return this.getFarmAction(metadata, MexFunction.exitFarm, 'Unstake farm tokens with');
      case MexFunction.claimDualYield:
      case MexFunction.claimDualYieldProxy:
        return this.getFarmAction(metadata, MexFunction.claimRewards, 'Claim dual yield for');
      case MexFunction.unbondFarm:
        return this.getFarmAction(metadata, MexFunction.unbondFarm, 'Unbond farm with');
      default:
        return undefined;
    }
  }

  private getFarmAction(metadata: TransactionMetadata, name: string, action: string): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, name, action);
  }
}
