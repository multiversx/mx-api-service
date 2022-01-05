import { Address } from "@elrondnetwork/erdjs";
import { Logger } from "@nestjs/common";

export class AddressUtils {
  static bech32Encode(publicKey: string) {
    return Address.fromHex(publicKey).bech32();
  };
  
  static bech32Decode(address: string) {
    return Address.fromBech32(address).hex();
  };

  static isAddressValid(address: string): boolean {
    try {
      new Address(address);
      return true;
    } catch (error) {
      return false;
    }
  }
  
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
    if (address.toLowerCase() === 'metachain') {
      return true;
    }

    try {
      return new Address(address).isContractAddress();
    } catch (error) {
      let logger = new Logger(AddressUtils.name);
      logger.error(`Error when determining whether address '${address}' is a smart contract address`);
      logger.error(error);
      return false;
    }
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