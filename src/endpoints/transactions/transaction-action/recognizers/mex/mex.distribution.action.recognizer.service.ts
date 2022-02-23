import { Injectable } from "@nestjs/common";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";

@Injectable()
export class MexDistributionActionRecognizerService {
  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (metadata.receiver === settings.distributionContract && metadata.functionName === MexFunction.claimLockedAssets) {
      return this.getClaimLockedAssetsAction();
    }

    return undefined;
  }

  private getClaimLockedAssetsAction(): TransactionAction {
    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.claimLockedAssets;
    result.description = 'Claim locked assets';

    return result;
  }
}
