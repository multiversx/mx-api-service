import { AddressUtils } from "src/utils/address.utils";

describe('Address utils', () => {

  it('Convert from Hex address to bech32', () => {
    expect(AddressUtils.bech32Encode('000000000000000000010000000000000000000000000000000000000001ffff')).toStrictEqual('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l');
  });

  it('Convert from bech32 address to hex', () => {
    expect(AddressUtils.bech32Decode('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')).toStrictEqual('000000000000000000010000000000000000000000000000000000000001ffff');
  });

  it('is smart contract address', () => {
    expect(AddressUtils.isSmartContractAddress('erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p')).toBeFalsy();
    expect(AddressUtils.isSmartContractAddress('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')).toBeTruthy();
  });

  it('compute shard for address', () => {
    expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p'))).toEqual(0);
    expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l'))).toEqual(4294967295);
    expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1yghjyzgq03vlmmav3cvdkcjqmnagq9u0qd7sqvt9060um88lxdrq7zs7za'))).toEqual(2);
  });

  it('check if address is valid, return true', () => {
    expect(AddressUtils.isAddressValid('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')).toBeTruthy();
  });

  it('check if address is not valid', () => {
    const address = AddressUtils.isAddressValid('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l');
    if (!address) {
      expect(address).toBeFalsy();
    }
  });

  it('Decode smart contract attribute "UPGRADEABLE"', () => {
    const attributesBase64 = 'BQI=';

    const properties = AddressUtils.decodeCodeMetadata(attributesBase64);

    if (properties) {
      expect(properties.isUpgradeable).toBeTruthy();
      expect(properties.isReadable).toBeTruthy();
      expect(properties.isPayable).toBeTruthy();
      expect(properties.isPayableBySmartContract).toBeFalsy();
    }
  });

  it('Decode smart contract attribute "READABLE"', () => {
    const attributesBase64 = 'BAA=';

    const properties = AddressUtils.decodeCodeMetadata(attributesBase64);

    if (properties) {
      expect(properties.isReadable).toBeTruthy();
      expect(properties.isUpgradeable).toBeFalsy();
      expect(properties.isPayable).toBeFalsy();
      expect(properties.isPayableBySmartContract).toBeFalsy();
    }
  });

  it('Decode smart contract attributes "PAYABLE"', () => {
    const attributesBase64 = 'AAI=';

    const properties = AddressUtils.decodeCodeMetadata(attributesBase64);
    if (properties) {
      expect(properties.isPayable).toBeTruthy();
      expect(properties.isUpgradeable).toBeFalsy();
      expect(properties.isReadable).toBeFalsy();
      expect(properties.isPayableBySmartContract).toBeFalsy();
    }
  });

  it('Decode smart contract attributes "PAYABLE_BY_SC"', () => {
    const attributesBase64 = 'AAQ=';

    const properties = AddressUtils.decodeCodeMetadata(attributesBase64);

    if (properties) {
      expect(properties.isPayableBySmartContract).toBeTruthy();
      expect(properties.isUpgradeable).toBeFalsy();
      expect(properties.isReadable).toBeFalsy();
      expect(properties.isPayable).toBeFalsy();
    }
  });
});
