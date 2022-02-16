import { BinaryUtils } from "./binary.utils";

export class MatchUtils {
  static getTagsFromBase64Attributes(attributes: string) {
    const decodedAttributes = BinaryUtils.base64Decode(attributes);
    return decodedAttributes.match(/tags:(?<tags>[\w\s\,]*)/);
  }

  static getMetadataFromBase64Attributes(attributes: string) {
    const decodedAttributes = BinaryUtils.base64Decode(attributes);
    return decodedAttributes.match(/metadata:(?<metadata>[\w\/\.]*)/);
  }
}
