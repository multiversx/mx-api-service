import { Injectable } from "@nestjs/common";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionEsdtNftRecognizerService } from "../esdt/transaction.action.esdt.nft.recognizer.service";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexLockedAssetActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService,
    private readonly transactionActionEsdtNftRecognizerService: TransactionActionEsdtNftRecognizerService,
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (metadata.receiver !== settings.lockedAssetContract) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.lockAssets:
        return this.getAssetsAction(metadata, 'Lock');
      case MexFunction.unlockAssets:
        return this.getAssetsAction(metadata, 'Unlock');
      case MexFunction.mergeLockedAssetTokens:
        return this.getMergeLockedAssetTokens(metadata);
      default:
        return undefined;
    }
  }

  private getMergeLockedAssetTokens(metadata: TransactionMetadata): TransactionAction | undefined {
    const transfers = this.mexSettingsService.getTransfers(metadata);
    if (!transfers) {
      return undefined;
    }

    const value = transfers.sumBigInt(x => BigInt(x.value.toString()));
    const valueDenominated = NumberUtils.toDenominatedString(value);

    const description = `Merge ${transfers.length} LKMEX positions into a single LKMEX position of value ${valueDenominated}`;

    return this.transactionActionEsdtNftRecognizerService.getMultiTransferAction(metadata, TransactionActionCategory.mex, MexFunction.mergeLockedAssetTokens, description);
  }

  private getAssetsAction(metadata: TransactionMetadata, action: string): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, metadata.functionName ?? '', action);
  }
}
