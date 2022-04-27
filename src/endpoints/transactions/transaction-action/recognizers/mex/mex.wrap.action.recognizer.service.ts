import { Injectable } from "@nestjs/common";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionEsdtNftRecognizerService } from "../esdt/transaction.action.esdt.nft.recognizer.service";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "../../../../mex.analytics/entities/mex.settings";
import { MexSettingsService } from "../../../../mex.analytics/mex.settings.service";

@Injectable()
export class MexWrapActionRecognizerService {
  constructor(
    private readonly transactionActionEsdtNftRecognizerService: TransactionActionEsdtNftRecognizerService,
    private readonly mexSettingsService: MexSettingsService,
  ) { }

  recognize(settings: MexSettings, metadata: TransactionMetadata): TransactionAction | undefined {
    if (!settings.wrapContracts.includes(metadata.receiver)) {
      return undefined;
    }

    switch (metadata.functionName) {
      case MexFunction.wrapEgld:
        return this.getWrapAction(metadata);
      case MexFunction.unwrapEgld:
        return this.getUnwrapAction(metadata);
      default:
        return undefined;
    }
  }

  private getWrapAction(metadata: TransactionMetadata): TransactionAction | undefined {
    const wegldId = this.mexSettingsService.getWegldId();
    if (!wegldId) {
      return undefined;
    }

    const valueDenominated = NumberUtils.toDenominatedString(metadata.value);


    const result = new TransactionAction();
    result.category = TransactionActionCategory.mex;
    result.name = MexFunction.wrapEgld;
    result.description = `Wrap ${valueDenominated} eGLD`;
    result.arguments = {
      token: {
        type: TokenType.FungibleESDT,
        name: 'WrappedEGLD',
        token: wegldId,
        ticker: wegldId.split('-')[0],
        decimals: 18,
        value: metadata.value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }

  private getUnwrapAction(metadata: TransactionMetadata): TransactionAction | undefined {
    return this.transactionActionEsdtNftRecognizerService.getMultiTransferActionWithTicker(metadata, TransactionActionCategory.mex, MexFunction.unwrapEgld, 'Unwrap');
  }
}
