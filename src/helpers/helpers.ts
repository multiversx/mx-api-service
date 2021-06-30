const bech32 = require('bech32');
const { readdirSync } = require('fs')

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

export function padHex(value: string): string {
  return (value.length % 2 ? '0' + value : value);
}

export function computeShard(hexPubKey: string) {
  let numShards = 3;
  let maskHigh = parseInt('11', 2);
  let maskLow = parseInt('01', 2);
  let pubKey = Buffer.from(hexPubKey, 'hex');
  let lastByteOfPubKey = pubKey[31];

  if (isAddressOfMetachain(pubKey)) {
    return 4294967295;
  }

  let shard = lastByteOfPubKey & maskHigh;

  if (shard > numShards - 1) {
    shard = lastByteOfPubKey & maskLow;
  }

  return shard;
};

function isAddressOfMetachain(pubKey: Buffer) {
  // prettier-ignore
  let metachainPrefix = Buffer.from([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]);
  let pubKeyPrefix = pubKey.slice(0, metachainPrefix.length);

  if (pubKeyPrefix.equals(metachainPrefix)) {
    return true;
  }

  let zeroAddress = Buffer.alloc(32).fill(0);

  if (pubKey.equals(zeroAddress)) {
    return true;
  }

  return false;
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

export function getDirectories(source: string) {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);
}