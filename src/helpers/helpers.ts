const bech32 = require('bech32');

export function mergeObjects(obj1: any, obj2: any) {
  for (const key of Object.keys(obj2)) {
      if (key in obj1) {
          obj1[key] = obj2[key];
      }
  }

  return obj1;
}

export function roundToEpoch(round: number): number {
  return Math.floor(round / 14401);
}

export function bech32Encode(publicKey: string) {
  const words = bech32.toWords(Buffer.from(publicKey, 'hex'));
  return bech32.encode('erd', words);
};

export function bech32Decode(address: string) {
  const decoded = bech32.decode(address, 256);
  return Buffer.from(bech32.fromWords(decoded.words)).toString('hex');
};

export function base64Encode(str: string) {
  return Buffer.from(str).toString('base64');
};

export function base64Decode(str: string): string {
  return base64DecodeBinary(str).toString('binary');
}

export function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, 'base64');
};

export function oneMinute(): number {
  return 60;
}

export function oneHour(): number { 
  return oneMinute() * 60;
}

export function oneDay(): number {
  return oneHour() * 24;
}

export function oneWeek(): number {
  return oneDay() * 7;
}

export function isSmartContractAddress(address: string): boolean {
  return address.includes('qqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqq');
}

declare global {
  interface Array<T> {
    groupBy(predicate: (item: T) => any): any;
    selectMany(predicate: (item: T) => T[]): T[];
  }
}

Array.prototype.groupBy = function(predicate: Function, asArray = false) {
  let result = this.reduce(function(rv, x) {
      (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
      return rv;
  }, {});

  if (asArray === true) {
      result = Object.keys(result).map(key => {
          return {
              key: key,
              values: result[key]
          };
      });
  }

  return result;
};

Array.prototype.selectMany = function(predicate: Function) {
  let result = [];

  for (let item of this) {
      result.push(...predicate(item));
  }

  return result;
};