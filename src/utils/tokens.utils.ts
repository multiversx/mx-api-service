import { ApiUtils } from "./api.utils";

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
    if (url.split('/').length < 7) {
      return undefined;
    }
    return `${url.split('/')[5]}-${url.split('/')[6]}`;
  }
}