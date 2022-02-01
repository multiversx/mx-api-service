export class StringUtils {
  static isFunctionName(value: string) {
    return new RegExp(/[^a-z0-9_]/gi).test(value) === false;
  }

  static isHex(value: string) {
    return new RegExp(/[^a-f0-9]/gi).test(value) === false;
  }
}
