const BigNumber = require('bignumber.js');
interface Denomination {
  input: string;
  denomination?: number;
  decimals?: number;
  showLastNonZeroDecimal?: boolean;
  addCommas?: boolean;
}

export class NumberUtils {
  static denominate(value: BigInt): number {
    return Number(value.valueOf() / BigInt(Math.pow(10, 18)));
  }
  static denominateFloat(input: Denomination): string {
    return format(input);
  }
  static denominateString(value: string): number {
    return NumberUtils.denominate(BigInt(value));
  }

  static numberDecode(encoded: string): string {
    const hex = Buffer.from(encoded, 'base64').toString('hex');
    return BigNumber(hex, 16).toString(10);
  }
}
function format({
  input,
  denomination = 18,
  decimals = 6,
  showLastNonZeroDecimal = false,
  addCommas = false,
}: Denomination) {
  if (input === '...') {
    return input;
  }
  if (input === '' || input === '0' || input === undefined) {
    input = '0';
  }
  showLastNonZeroDecimal =
    typeof showLastNonZeroDecimal !== 'undefined'
      ? showLastNonZeroDecimal
      : false;
  let array = input.split('');
  if (denomination !== 0) {
    // make sure we have enough characters
    while (array.length < denomination + 1) {
      array.unshift('0');
    }
    // add our dot
    array.splice(array.length - denomination, 0, '.');
    // make sure there are enough decimals after the dot
    while (array.length - array.indexOf('.') <= decimals) {
      array.push('0');
    }

    if (showLastNonZeroDecimal) {
      let nonZeroDigitIndex = 0;
      for (let i = array.length - 1; i > 0; i--) {
        if (array[i] !== '0') {
          nonZeroDigitIndex = i + 1;
          break;
        }
      }
      const decimalsIndex = array.indexOf('.') + decimals + 1;
      const sliceIndex = Math.max(decimalsIndex, nonZeroDigitIndex);
      array = array.slice(0, sliceIndex);
    } else {
      // trim unnecessary characters after the dot
      array = array.slice(0, array.indexOf('.') + decimals + 1);
    }
  }
  if (addCommas) {
    // add comas every 3 characters
    array = array.reverse();
    const reference = denomination
      ? array.length - array.indexOf('.') - 1
      : array.length;
    const count = Math.floor(reference / 3);
    for (let i = 1; i <= count; i++) {
      const position = array.indexOf('.') + 3 * i + i;
      if (position !== array.length) {
        array.splice(position, 0, ',');
      }
    }
    array = array.reverse();
  }

  const allDecimalsZero = array
    .slice(array.indexOf('.') + 1)
    .every((digit: { toString: () => string }) => digit.toString() === '0');

  const string = array.join('');

  if (allDecimalsZero) {
    return string.split('.')[0];
  }

  return decimals === 0 ? string.split('.').join('') : string;
}
