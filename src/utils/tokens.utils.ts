export class TokenUtils {
  static isEsdt(tokenIdentifier: string) {
    return tokenIdentifier.split('-').length === 2;
  }
}