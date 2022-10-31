import { AddressUtils, BinaryUtils, OriginLogger } from "@elrondnetwork/erdnest";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionExtractorInterface } from "./transaction.extractor.interface";

export class NftCreateTransactionExtractor implements TransactionExtractorInterface<{ collection: string }> {
  private readonly logger = new OriginLogger(NftCreateTransactionExtractor.name);

  canDetectNftCreateTransactionFromLogs(transaction: ShardTransaction): Boolean {
    if (!transaction.sender || !transaction.receiver) {
      return false;
    }

    if (!AddressUtils.isSmartContractAddress(transaction.receiver)) {
      return false;
    }

    if (transaction.getDataFunctionName() !== 'buy') {
      return false;
    }

    return true;
  }

  extract(transaction: ShardTransaction, transactionDetailed?: TransactionDetailed) {
    if (transactionDetailed) {
      const events = transactionDetailed.logs?.events;
      if (!events) {
        return undefined;
      }

      for (const event of events) {
        if (!event.identifier || event.identifier !== 'ESDTNFTCreate') {
          continue;
        }

        const collectionBase64 = event.topics[0];
        if (!collectionBase64) {
          continue;
        }

        const collection = BinaryUtils.base64Decode(collectionBase64);
        this.logger.log(`Detected NFT create from logs for collection '${collection}' and tx hash '${transaction.hash}'`);
        return { collection };
      }
    }

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

    let collection: string = '';

    try {
      collection = BinaryUtils.hexToString(collectionHex);
    } catch (error: any) {
      const logger = new Logger(NftCreateTransactionExtractor.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    this.logger.log(`Detected NFT create for collection '${collection}' and tx hash '${transaction.hash}'`);
    return { collection };
  }
}
