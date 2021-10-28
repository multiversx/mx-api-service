import { AddressUtils } from "src/utils/address.utils";
import { TransactionUtils } from "src/utils/transaction.utils";

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

  describe('Transaction Utils', () => {
    it('is cahngeSFTToMetaESDT transaction', () => {
      expect(TransactionUtils.isChangeSFTToMetaESDTTransaction('dGVzdFRyYW5zYWN0aW9u')).toBeFalsy();
      expect(TransactionUtils.isChangeSFTToMetaESDTTransaction('dGVzdFRyYW5zYWN0aW9uQA==')).toBeFalsy();
      expect(TransactionUtils.isChangeSFTToMetaESDTTransaction('Y2hhbmdlU0ZUVG9NZXRhRVNEVA==')).toBeFalsy();
      expect(TransactionUtils.isChangeSFTToMetaESDTTransaction('Y2hhbmdlU0ZUVG9NZXRhRVNEVEA=')).toBeTruthy();
    });

    it('is esdt nft create transaction', () => {
      expect(TransactionUtils.isESDTNFTCreateTransaction('dGVzdFRyYW5zYWN0aW9u')).toBeFalsy();
      expect(TransactionUtils.isESDTNFTCreateTransaction('dGVzdFRyYW5zYWN0aW9uQA==')).toBeFalsy();
      expect(TransactionUtils.isESDTNFTCreateTransaction('Y2hhbmdlU0ZUVG9NZXRhRVNEVA==')).toBeFalsy();
      expect(TransactionUtils.isESDTNFTCreateTransaction('Y2hhbmdlU0ZUVG9NZXRhRVNEVEA=')).toBeFalsy();
      expect(TransactionUtils.isESDTNFTCreateTransaction('RVNEVE5GVENyZWF0ZQ==')).toBeFalsy();
      expect(TransactionUtils.isESDTNFTCreateTransaction('RVNEVE5GVENyZWF0ZUA=')).toBeTruthy();
    });

    it('extract collection identifier', () => {
      expect(TransactionUtils.extractCollectionIdentifier(
        'RVNEVE5GVENyZWF0ZUA1MjU1NGU0ZjRlNDUyZDM2NjYzMjM1MzkzNUAwMUA0ZTQ2NTQ1NDQ1NTM1NEAwOWM0QDUxNmQ1MjczNWEzNzc1NTA1NjYxNzQzNTZhNjkzMzY3NzA1NzQxNTg0ZDY0NzM0ZTcwNGQzOTUzNzk2NjYyNGM2MzQ1NGE3ODZmMzYzODRlNzA1NTM5MzE1NjZlQDc0NjE2NzczM2E0MzYxNmUyMDQ5MjA2ZDY5NmU3NDIwNmQ3NTZjNzQ2OTcwNmM2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDU5NjE3MzYzNjY0NzM1NGQ0ZDM1Nzg3NDc5NmEzOTZiNTU1YTU0Nzc2Njc2NGQzMTc5MzQ3MDU2NTQ2NzMzNjc1MTc1NzY1NjU3Njk3MDZmNzIzNjUzMzlANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDUyNzM1YTM3NzU1MDU2NjE3NDM1NmE2OTMzNjc3MDU3NDE1ODRkNjQ3MzRlNzA0ZDM5NTM3OTY2NjI0YzYzNDU0YTc4NmYzNjM4NGU3MDU1MzkzMTU2NmU=')
      ).toStrictEqual('RUNONE-6f2595');
    });

    it('extract nft metadata', () => {
      expect(TransactionUtils.extractNFTMetadata(
        'RVNEVE5GVENyZWF0ZUA1MjU1NGU0ZjRlNDUyZDM2NjYzMjM1MzkzNUAwMUA0ZTQ2NTQ1NDQ1NTM1NEAwOWM0QDUxNmQ1MjczNWEzNzc1NTA1NjYxNzQzNTZhNjkzMzY3NzA1NzQxNTg0ZDY0NzM0ZTcwNGQzOTUzNzk2NjYyNGM2MzQ1NGE3ODZmMzYzODRlNzA1NTM5MzE1NjZlQDc0NjE2NzczM2E0MzYxNmUyMDQ5MjA2ZDY5NmU3NDIwNmQ3NTZjNzQ2OTcwNmM2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDU5NjE3MzYzNjY0NzM1NGQ0ZDM1Nzg3NDc5NmEzOTZiNTU1YTU0Nzc2Njc2NGQzMTc5MzQ3MDU2NTQ2NzMzNjc1MTc1NzY1NjU3Njk3MDZmNzIzNjUzMzlANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDUyNzM1YTM3NzU1MDU2NjE3NDM1NmE2OTMzNjc3MDU3NDE1ODRkNjQ3MzRlNzA0ZDM5NTM3OTY2NjI0YzYzNDU0YTc4NmYzNjM4NGU3MDU1MzkzMTU2NmU=')
      ).toStrictEqual('QmRsZ7uPVat5ji3gpWAXMdsNpM9SyfbLcEJxo68NpU91Vn');
    });
  });
});