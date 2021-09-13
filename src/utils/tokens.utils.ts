export class TokenUtils {
  static isEsdt(tokenIdentifier: string) {
    return tokenIdentifier.split('-').length === 2;
  }

  static canBool(string: string) {
    return string.split('-').pop() === 'true';
  };
}