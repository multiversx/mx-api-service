import { BinaryUtils } from "./binary.utils";

export class TransactionUtils {
  static isChangeSFTToMetaESDTTransaction(data: string) {
    return BinaryUtils.base64Decode(data).startsWith('changeSFTToMetaESDT@');
  }

  static isESDTNFTCreateTransaction(data: string) {
    return BinaryUtils.base64Decode(data).startsWith('ESDTNFTCreateTransaction@');
  }

  static extractCollectionIdentifier(data: string) {
    const collectionIdentifierHex = BinaryUtils.base64Decode(data).split('@')[1];

    return BinaryUtils.hexToString(collectionIdentifierHex);
  }

  static extractNFTMetadata(data: string) {
    const nftMetadataHex = BinaryUtils.base64Decode(data).split('@')[5];

    return BinaryUtils.hexToString(nftMetadataHex);
  }
}