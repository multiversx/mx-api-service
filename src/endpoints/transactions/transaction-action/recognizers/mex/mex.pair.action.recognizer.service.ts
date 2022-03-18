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
import { TransactionActionEsdtNftRecognizerService } from "../esdt/transaction.action.esdt.nft.recognizer.service";

@Injectable()
export class MexPairActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService,
    private readonly tokenTransferService: TokenTransferService,
    private readonly transactionActionEsdtNftRecognizerService: TransactionActionEsdtNftRecognizerService,
  ) { }

  async recognize(settings: MexSettings, metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    if (!settings.pairContracts.includes(metadata.receiver)) {
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

    metadata.transfers?.push({
      value: destinationValue,
      properties: pair2Properties,
    });

    const description = `Swap ${valueDenominated} ${pair1Properties.ticker} for a minimum of ${destinationValueDenominated} ${pair2Properties.ticker}`;
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferAction(metadata, TransactionActionCategory.mex, 'swap', description);
  }

  private getAddLiquidityAction(metadata: TransactionMetadata): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, MexFunction.addLiquidity, 'Added liquidity for');
  }

  private getRemoveLiquidityAction(metadata: TransactionMetadata): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, MexFunction.removeLiquidity, 'Removed liquidity with');
  }
}
