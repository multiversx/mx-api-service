import { AddressUtils } from "src/utils/address.utils";

describe('API utils', () => { 
  describe('Address Utils', () => {
    it('is smart contract address', () => {
      expect(AddressUtils.isSmartContractAddress('erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p')).toBeFalsy();
      expect(AddressUtils.isSmartContractAddress('asdasdasdasdasda')).toBeFalsy();
      expect(AddressUtils.isSmartContractAddress('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l')).toBeTruthy();
    });

    it('compute shard for address', () => {
      expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1rf4hv70arudgzus0ymnnsnc4pml0jkywg2xjvzslg0mz4nn2tg7q7k0t6p'))).toEqual(0);
      expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l'))).toEqual(4294967295);
      expect(AddressUtils.computeShard(AddressUtils.bech32Decode('erd1yghjyzgq03vlmmav3cvdkcjqmnagq9u0qd7sqvt9060um88lxdrq7zs7za'))).toEqual(2);
    });
  });
});