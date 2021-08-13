const BigNumber = require('bignumber.js');

export class NumberUtils {
  static denominate(value: BigInt): number {
    return Number(value.valueOf() / BigInt(Math.pow(10, 18)));
  }
  
  static denominateString(value: string): number {
    return NumberUtils.denominate(BigInt(value));
  }
  
  static numberDecode(encoded: string) {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigNumber(hex, 16).toString(10);
  };
}