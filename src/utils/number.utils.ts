import BigNumber from 'bignumber.js';
import { Balance } from '@elrondnetwork/erdjs';
export class NumberUtils {
  static denominate(value: BigInt): number {
    return Number(value.valueOf() / BigInt(Math.pow(10, 18)));
  }
  static denominateFloat(input: string): string {
    return Balance.fromString(input).toDenominated();
  }
  static denominateString(value: string): number {
    return NumberUtils.denominate(BigInt(value));
  }

  static numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return new BigNumber(hex, 16).toString(10);
  }
}
