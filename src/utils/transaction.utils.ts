import { BinaryUtils } from "./binary.utils";

export class TransactionUtils {
  static isChangeSFTToMetaESDTTransaction(data: string) {
    return BinaryUtils.base64Decode(data).startsWith('changeSFTToMetaESDT@');
  }

  static extractCollectionIdentifier(data: string) {
    const collectionIdentifierHex = BinaryUtils.base64Decode(data).split('@')[1];

    return BinaryUtils.hexToString(collectionIdentifierHex);
  }
}