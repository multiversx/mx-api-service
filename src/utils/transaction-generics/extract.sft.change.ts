import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { BinaryUtils } from "../binary.utils";
import { TryGenericExtract } from "./generic.extract";

export class TryExtractSftChange extends TryGenericExtract {
  constructor(
    readonly transaction: ShardTransaction,
  ) {
    super(transaction);
  }

  extract() {
    if (this.transaction.getDataFunctionName() !== 'changeSFTToMetaESDT') {
      return undefined;
    }

    const args = this.transaction.getDataArgs();
    if (!args || args.length === 0) {
      return undefined;
    }

    const collectionIdentifierHex = args[0];

    try {
      return BinaryUtils.hexToString(collectionIdentifierHex);
    } catch (error: any) {
      const logger = new Logger(TryExtractSftChange.name);
      logger.error(`Error in tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction function. Could not convert hex '${collectionIdentifierHex}' to string`);
      logger.error(error);
      return undefined;
    }
  }
}
