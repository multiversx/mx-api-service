import { Injectable } from "@nestjs/common";
import { BinaryUtils } from "src/utils/binary.utils";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexPairActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService,
    private readonly tokenTransferService: TokenTransferService,
  ) { }

  async recognize(settings: MexSettings, metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    if (metadata.receiver !== settings.proxyContract && !settings.pairContracts.includes(metadata.receiver)) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.swapTokensFixedInput:
      case MexFunction.swapTokensFixedOutput:
        return await this.getSwapAction(metadata);
      case MexFunction.addLiquidity:
      case MexFunction.addLiquidityProxy:
        return this.getAddLiquidityAction(metadata);
      case MexFunction.removeLiquidity:
      case MexFunction.removeLiquidityProxy:
        return this.getRemoveLiquidityAction(metadata);
      default:
        return undefined;
    }
  }

  private async getSwapAction(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    const transfers = this.mexSettingsService.getTransfers(metadata);
    if (!transfers) {
      return undefined;
    }

    const pair1Properties = transfers[0].properties;
    if (!pair1Properties) {
      return undefined;
    }

    const value = transfers[0].value;
    const valueDenominated = NumberUtils.toDenominatedString(value, pair1Properties.decimals);

    const destinationTokenIdentifier = BinaryUtils.hexToString(metadata.functionArgs[0]);
    const destinationValue = BinaryUtils.hexToBigInt(metadata.functionArgs[1]);

    const pair2Properties = await this.tokenTransferService.getTokenTransferProperties(destinationTokenIdentifier);
    if (!pair2Properties) {
      return undefined;
    }

    const destinationValueDenominated = NumberUtils.toDenominatedString(destinationValue, pair2Properties.decimals);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = 'swap';
    result.description = `Swap ${valueDenominated} ${pair1Properties.ticker} for a minimum of ${destinationValueDenominated} ${pair2Properties.ticker}`;
    result.arguments = {
      token1: {
        ...pair1Properties,
        value: value.toString(),
      },
      token2: {
        ...pair2Properties,
        value: destinationValue.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getAddLiquidityAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const transfers = this.mexSettingsService.getTransfers(metadata);
    if (!transfers) {
      return undefined;
    }

    const pair1Properties = transfers[0].properties;
    if (!pair1Properties) {
      return undefined;
    }

    const pair2Properties = transfers[1].properties;
    if (!pair2Properties) {
      return undefined;
    }

    const pair1Value = transfers[0].value;
    const pair1ValueDenominated = NumberUtils.toDenominatedString(pair1Value, pair1Properties.decimals);

    const pair2Value = transfers[1].value;
    const pair2ValueDenominated = NumberUtils.toDenominatedString(pair2Value, pair2Properties.decimals);

    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.addLiquidity;
    result.description = `Added liquidity for ${pair1ValueDenominated} ${pair1Properties.ticker} and ${pair2ValueDenominated} ${pair2Properties.ticker}`;
    result.arguments = {
      token1: {
        ...pair1Properties,
        value: pair1Value.toString(),
      },
      token2: {
        ...pair2Properties,
        value: pair2Value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getRemoveLiquidityAction(metadata: TransactionMetadata): TransactionAction | undefined {
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
    result.name = MexFunction.removeLiquidity;
    result.description = `Removed liquidity ${valueDenominated} for ${properties.ticker}`;
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
