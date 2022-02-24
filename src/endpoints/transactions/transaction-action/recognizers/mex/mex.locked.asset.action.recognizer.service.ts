import { Injectable } from "@nestjs/common";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexLockedAssetActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (metadata.receiver !== settings.lockedAssetContract) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.unlockAssets:
        return this.getUnlockAssetsAction(metadata);
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

    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.mergeLockedAssetTokens;
    result.description = `Merge ${transfers.length} LKMEX positions into a single LKMEX position of value ${valueDenominated}`;
    result.arguments = {
      transfers: transfers.map(transfer => ({
        ...transfer.properties,
        ticker: 'LKMEX',
        value: transfer.value.toString(),
      })),
      receiver: metadata.receiver,
    };

    return result;
  }

  private getUnlockAssetsAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const transfers = this.mexSettingsService.getTransfers(metadata);
    if (!transfers) {
      return undefined;
    }

    const properties = transfers[0].properties;
    if (!properties) {
      return undefined;
    }

    const value = transfers[0].value;
    const valueDenominated = NumberUtils.toDenominatedString(value, properties.decimals);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.unlockAssets;
    result.description = `Unlock ${valueDenominated} LKMEX`;
    result.arguments = {
      token: {
        ...properties,
        ticker: 'LKMEX',
        value: value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }
}
