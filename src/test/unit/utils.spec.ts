import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { AddressUtils } from "src/utils/address.utils";
import { MatchUtils } from "src/utils/match.utils";
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
    it('tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction', () => {
      let transaction = new ShardTransaction();
      transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
      expect(TransactionUtils.tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
      expect(TransactionUtils.tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
      expect(TransactionUtils.tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVEA0NTQ3NGM0NDRkNDU1ODQ2MmQzNjM3NjE2MzM0MzlAMTJAOWFhNjNj';
      expect(TransactionUtils.tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction(transaction)).toEqual('EGLDMEXF-67ac49');
    });

    it('tryExtractNftMetadataFromNftCreateTransaction', () => {
      let transaction = new ShardTransaction();
      transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
      expect(TransactionUtils.tryExtractNftMetadataFromNftCreateTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
      expect(TransactionUtils.tryExtractNftMetadataFromNftCreateTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
      expect(TransactionUtils.tryExtractNftMetadataFromNftCreateTransaction(transaction)).toBeUndefined();
      transaction = new ShardTransaction();
      transaction.data = 'RVNEVE5GVENyZWF0ZUA0ZTQ2NTQyZDM4MzEzMTM4Mzc2NkAwMUA0NDY1NjE2Y0BANTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjFANzQ2MTY3NzMzYTYxNzI3MjZmNzcyYzc3NzI2ZjZlNjcyYzczNjk2NzZlNjE2YzJjNzA2NTcyNjM2NTZlNzQyYzZjNjk2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDYxNzI3MDZlNDQzNjZiNDY0NTRhNjg0NzQxNWEzNzZiNGQ1OTc5MzE3NzQ4NjI0MzczNTA1MTc5NjQ3MTYyNjE1OTMzNDE1ODZkNTczMTQ4Mzk2YTYyNjJANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjE=';
      expect(TransactionUtils.tryExtractNftMetadataFromNftCreateTransaction(transaction)).toMatchObject({ collection: 'NFT-81187f', attributes: 'tags:arrow,wrong,signal,percent,lie;metadata:QmarpnD6kFEJhGAZ7kMYy1wHbCsPQydqbaY3AXmW1H9jbb'});
    });
  });

  describe('Match Utils', () => {
    it('getTagsFromBase64Attributes', () => {
      let match = MatchUtils.getTagsFromBase64Attributes('bWV0YWRhdGE6');
      expect(match).toBeNull();

      match = MatchUtils.getTagsFromBase64Attributes('bWV0YWRhdGE6YXNkYWRzYTt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['tags']).toEqual('1,2,3,4');
      }
    })
    it('getMetadataFromBase64Attributes', () => {
      let match = MatchUtils.getMetadataFromBase64Attributes('bWV0YWRhdGE6dGVzdDt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['metadata']).toEqual('test');
      }

      match = MatchUtils.getMetadataFromBase64Attributes('bWV0YWRhdGE6dGVzdC93aXRoLjt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['metadata']).toEqual('test/with.');
      }

      match = MatchUtils.getMetadataFromBase64Attributes('dGFnczoxLDIsMyw0');
      expect(match).toBeNull();
    })
  })
});