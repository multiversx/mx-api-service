import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { BinaryUtils } from "../binary.utils";
import { TryGenericExtract } from "./generic.extract";

export class TryExtractNftCreate extends TryGenericExtract {
  constructor(
    readonly transaction: ShardTransaction,
  ) {
    super(transaction);
  }

  extract() {
    if (this.transaction.getDataFunctionName() !== 'ESDTNFTCreate') {
      return undefined;
    }

    const args = this.transaction.getDataArgs();
    if (!args || args.length < 6) {
      return undefined;
    }

    const collectionHex = args[0];
    const attributesHex = args[5];

    let collection: string = '';
    let attributes: string = '';

    try {
      collection = BinaryUtils.hexToString(collectionHex);
    } catch (error: any) {
      const logger = new Logger(TryExtractNftCreate.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    try {
      attributes = BinaryUtils.hexToString(attributesHex);
    } catch (error: any) {
      const logger = new Logger(TryExtractNftCreate.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert attributes hex '${attributesHex}' to string`);
      logger.error(error);
      return undefined;
    }

    return { collection, attributes };
  }
}
