import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { BinaryUtils } from "../../../utils/binary.utils";
import { TransactionExtractorInterface } from "./transaction.extractor.interface";

export class NftCreateTransactionExtractor implements TransactionExtractorInterface<{ collection: string, attributes: string }> {
  extract(transaction: ShardTransaction) {
    if (transaction.sender !== transaction.receiver) {
      return undefined;
    }

    if (transaction.getDataFunctionName() !== 'ESDTNFTCreate') {
      return undefined;
    }

    const args = transaction.getDataArgs();
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
      const logger = new Logger(NftCreateTransactionExtractor.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    try {
      attributes = BinaryUtils.hexToString(attributesHex);
    } catch (error: any) {
      const logger = new Logger(NftCreateTransactionExtractor.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert attributes hex '${attributesHex}' to string`);
      logger.error(error);
      return undefined;
    }

    return { collection, attributes };
  }
}
