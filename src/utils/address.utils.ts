const bech32 = require('bech32');

export class AddressUtils {
  static bech32Encode(publicKey: string) {
    const words = bech32.toWords(Buffer.from(publicKey, 'hex'));
    return bech32.encode('erd', words);
  };
  
  static bech32Decode(address: string) {
    const decoded = bech32.decode(address, 256);
    return Buffer.from(bech32.fromWords(decoded.words)).toString('hex');
  };
  
  static computeShard(hexPubKey: string) {
    let numShards = 3;
    let maskHigh = parseInt('11', 2);
    let maskLow = parseInt('01', 2);
    let pubKey = Buffer.from(hexPubKey, 'hex');
    let lastByteOfPubKey = pubKey[31];
  
    if (AddressUtils.isAddressOfMetachain(pubKey)) {
      return 4294967295;
    }
  
    let shard = lastByteOfPubKey & maskHigh;
  
    if (shard > numShards - 1) {
      shard = lastByteOfPubKey & maskLow;
    }
  
    return shard;
  };
  
  static isSmartContractAddress(address: string): boolean {
    return address.includes('qqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqq');
  }

  private static isAddressOfMetachain(pubKey: Buffer) {
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
}