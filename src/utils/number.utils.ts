const BigNumber = require('bignumber.js');

export class NumberUtils {
  static padHex(value: string): string {
    return (value.length % 2 ? '0' + value : value);
  }
  
  static denominate(value: BigInt): number {
    return Number(value.valueOf() / BigInt(Math.pow(10, 18)));
  }
  
  static denominateString(value: string): number {
    return NumberUtils.denominate(BigInt(value));
  }
  
  static hexToString(hex: string): string {
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    
    return str;
  }
  
  static numberDecode(encoded: string) {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigNumber(hex, 16).toString(10);
  };
}