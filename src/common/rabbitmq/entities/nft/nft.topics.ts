import { BinaryUtils } from "src/utils/binary.utils";
import { NumberUtils } from "src/utils/number.utils";

export class NftTopics {
  identifier: string = '';
  collection: string = '';
  nonce: number = 0;

  constructor(rawTopics: string[]) {
    this.collection = BinaryUtils.base64Decode(rawTopics[0]);
    this.nonce = parseInt(NumberUtils.numberDecode(rawTopics[1]));

    const hexNonce = BinaryUtils.base64ToHex(rawTopics[1]);
    this.identifier = `${this.collection}-${hexNonce}`;
  }

  toPlainObject() {
    return {
      identifier: this.identifier,
      collection: this.collection,
      nonce: this.nonce,
    };
  }
}
