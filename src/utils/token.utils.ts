import { ApiUtils } from "./api.utils";
import * as crypto from 'crypto-js';

export class TokenUtils {
  static isEsdt(tokenIdentifier: string) {
    return tokenIdentifier.split('-').length === 2;
  }

  static canBool(string: string) {
    return string.split('-').pop() === 'true';
  };

  static computeNftUri(uri: string, prefix: string) {
    return ApiUtils.replaceUri(uri, 'https://ipfs.io/ipfs', prefix);
  }

  static getUrlHash(url: string) {
    return crypto.SHA256(url).toString().slice(0, 8);
  }

  static getThumbnailUrlIdentifier(nftIdentifier: string, fileUrl: string) {
    const collectionIdentifier = nftIdentifier.split('-').slice(0, 2).join('-');
    const urlHash = TokenUtils.getUrlHash(fileUrl);

    return `${collectionIdentifier}-${urlHash}`;
  }
}