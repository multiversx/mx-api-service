import { Address } from "@elrondnetwork/erdjs";
import { Logger } from "@nestjs/common";
import { BinaryUtils } from "./binary.utils";

export class AddressUtils {
  static bech32Encode(publicKey: string) {
    return Address.fromHex(publicKey).bech32();
  }

  static bech32Decode(address: string) {
    return Address.fromBech32(address).hex();
  }

  static isAddressValid(address: string | Buffer): boolean {
    try {
      new Address(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  static computeShard(hexPubKey: string) {
    const numShards = 3;
    const maskHigh = parseInt('11', 2);
    const maskLow = parseInt('01', 2);
    const pubKey = Buffer.from(hexPubKey, 'hex');
    const lastByteOfPubKey = pubKey[31];

    if (AddressUtils.isAddressOfMetachain(pubKey)) {
      return 4294967295;
    }

    let shard = lastByteOfPubKey & maskHigh;

    if (shard > numShards - 1) {
      shard = lastByteOfPubKey & maskLow;
    }

    return shard;
  }

  static isSmartContractAddress(address: string): boolean {
    if (address.toLowerCase() === 'metachain') {
      return true;
    }

    try {
      return new Address(address).isContractAddress();
    } catch (error) {
      const logger = new Logger(AddressUtils.name);
      logger.error(`Error when determining whether address '${address}' is a smart contract address`);
      logger.error(error);
      return false;
    }
  }

  private static isAddressOfMetachain(pubKey: Buffer) {
    // prettier-ignore
    const metachainPrefix = Buffer.from([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const pubKeyPrefix = pubKey.slice(0, metachainPrefix.length);

    if (pubKeyPrefix.equals(metachainPrefix)) {
      return true;
    }

    const zeroAddress = Buffer.alloc(32).fill(0);

    if (pubKey.equals(zeroAddress)) {
      return true;
    }

    return false;
  }

  static decodeAddressAttributes(codeMetadata: string) {
    if (!codeMetadata) {
      return undefined;
    }

    const codeHex = BinaryUtils.tryBase64ToHex(codeMetadata);
    if (!codeHex || codeHex.length !== 4) {
      return undefined;
    }

    const isUpgradeable = codeHex[1] === '1';
    const isReadable = codeHex[1] === '4';
    const isPayable = codeHex[3] === '2';
    const isPayableBySc = codeHex[3] === '4';

    return { isUpgradeable, isReadable, isPayable, isPayableBySc };
  }
}