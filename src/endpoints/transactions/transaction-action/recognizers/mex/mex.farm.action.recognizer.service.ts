import { Injectable } from "@nestjs/common";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexFarmActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (metadata.receiver !== settings.proxyContract && !settings.farmContracts.includes(metadata.receiver)) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.enterFarm:
      case MexFunction.enterFarmProxy:
        return this.getEnterFarmAction(metadata);
      case MexFunction.enterFarmAndLockRewards:
      case MexFunction.enterFarmAndLockRewardsProxy:
        return this.getEnterFarmAndLockAction(metadata);
      case MexFunction.exitFarm:
      case MexFunction.exitFarmProxy:
        return this.getExitFarmAction(metadata);
      case MexFunction.claimRewards:
      case MexFunction.claimRewardsProxy:
        return this.getClaimRewardsAction(metadata);
      case MexFunction.compoundRewards:
      case MexFunction.compoundRewardsProxy:
        return this.getCompundRewardsAction(metadata);
      default:
        return undefined;
    }
  }

  private getEnterFarmAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const transfers = this.mexSettingsService.getTransfers(metadata);
    if (!transfers) {
      return undefined;
    }

    const pairProperties = transfers[0].properties;
    if (!pairProperties) {
      return undefined;
    }

    const value = transfers[0].value;
    const valueDenominated = NumberUtils.toDenominatedString(value, pairProperties.decimals);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.enterFarm;
    result.description = `Enter farm with ${valueDenominated} ${pairProperties.ticker}`;
    result.arguments = {
      token: {
        ...pairProperties,
        value: value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getExitFarmAction(metadata: TransactionMetadata): TransactionAction | undefined {
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
    result.name = MexFunction.exitFarm;
    result.description = `Exit farm with ${valueDenominated} ${properties.ticker}`;
    result.arguments = {
      token: {
        ...properties,
        value: value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getEnterFarmAndLockAction(metadata: TransactionMetadata): TransactionAction | undefined {
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
    result.name = MexFunction.enterFarmAndLockRewards;
    result.description = `Enter farm and lock rewards with ${valueDenominated} ${properties.ticker}`;
    result.arguments = {
      token: {
        ...properties,
        value: transfers[0].value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getClaimRewardsAction(metadata: TransactionMetadata): TransactionAction | undefined {
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
    result.name = MexFunction.claimRewards;
    result.description = `Claim rewards ${valueDenominated} ${properties.ticker}`;
    result.arguments = {
      token: {
        ...properties,
        value: transfers[0].value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getCompundRewardsAction(metadata: TransactionMetadata): TransactionAction | undefined {
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
    result.name = MexFunction.compoundRewards;
    result.description = `Reinvest rewards ${valueDenominated} ${properties.ticker}`;
    result.arguments = {
      token: {
        ...properties,
        value: transfers[0].value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }
}
