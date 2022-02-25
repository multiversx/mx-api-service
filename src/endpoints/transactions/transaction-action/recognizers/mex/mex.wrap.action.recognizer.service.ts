import { Injectable } from "@nestjs/common";
import { NumberUtils } from "src/utils/number.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { MexFunction } from "./entities/mex.function.options";
import { MexSettings } from "./entities/mex.settings";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { MexSettingsService } from "./mex.settings.service";

@Injectable()
export class MexWrapActionRecognizerService {
  constructor(
    private readonly mexSettingsService: MexSettingsService
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
    const valueDenominated = NumberUtils.toDenominatedString(metadata.value);
    const wegldId = this.mexSettingsService.getWegldId();
    if (!wegldId) {
      return undefined;
    }

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
    result.name = MexFunction.unwrapEgld;
    result.description = `Unwrap ${valueDenominated} eGLD`;
    result.arguments = {
      token: {
        ...properties,
        ticker: "WEGLD",
        value: value.toString(),
      },
      receiver: metadata.receiver,
    };

    return result;
  }
}
