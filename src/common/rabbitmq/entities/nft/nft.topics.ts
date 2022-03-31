import { Logger } from "@nestjs/common";
import { BinaryUtils } from "src/utils/binary.utils";
import { NumberUtils } from "src/utils/number.utils";

export class NftTopics {
  identifier: string = '';
  collection: string = '';
  nonce: number = 0;

  constructor(rawTopics: string[]) {
    const logger = new Logger(NftTopics.name);

    try {
      this.collection = BinaryUtils.base64Decode(rawTopics[0]);
      this.nonce = parseInt(NumberUtils.numberDecode(rawTopics[1]));

      const hexNonce = BinaryUtils.base64ToHex(rawTopics[1]);
      this.identifier = `${this.collection}-${hexNonce}`;
    } catch (error) {
      logger.error(`An unhandled error occurred when decoding NFT topics from raw topics`);
      logger.error(error);
    }
  }

  toPlainObject() {
    return {
      identifier: this.identifier,
      collection: this.collection,
      nonce: this.nonce,
    };
  }
}
