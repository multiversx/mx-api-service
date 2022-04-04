import { BinaryUtils } from "src/utils/binary.utils";
import { NumberUtils } from "src/utils/number.utils";

export class NftTopics {
  identifier: string = '';
  collection: string = '';
  nonce: number = 0;

  static parse(rawTopics: string[]): NftTopics {
    const hexNonce = BinaryUtils.base64ToHex(rawTopics[1]);

    const topics = new NftTopics();
    topics.collection = BinaryUtils.base64Decode(rawTopics[0]);
    topics.nonce = parseInt(NumberUtils.numberDecode(rawTopics[1]));
    topics.identifier = `${topics.collection}-${hexNonce}`;

    return topics;
  }

  toPlainObject() {
    return {
      identifier: this.identifier,
      collection: this.collection,
      nonce: this.nonce,
    };
  }
}
