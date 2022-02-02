import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { BinaryUtils } from "../binary.utils";
import { TryGenericExtract } from "./generic.extract";

export class TryExtractUpdateMetadata extends TryGenericExtract {
  constructor(
    readonly transaction: ShardTransaction,
  ) {
    super(transaction);
  }

  extract() {
    if (this.transaction.getDataFunctionName() !== 'ESDTNFTUpdateAttributes') {
      return undefined;
    }

    const args = this.transaction.getDataArgs();
    if (!args || args.length < 3) {
      return undefined;
    }

    const collectionHex = args[0];
    const nonceHex = args[1];

    let collection: string = '';
    const nonce: string = nonceHex;

    try {
      collection = BinaryUtils.hexToString(collectionHex);
    } catch (error: any) {
      const logger = new Logger(TryExtractUpdateMetadata.name);
      logger.error(`Error in tryExtractNftMetadataFromUpdateAttributes function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    const identifier = `${collection}-${nonce}`;
    return { identifier };
  }
}
