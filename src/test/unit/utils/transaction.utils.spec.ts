import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TryGenericExtract } from "src/utils/transaction-generics/generic.extract";
import { TryExtractSftChange } from "src/utils/transaction-generics/extract.sft.change";
import { TryExtractNftCreate } from "src/utils/transaction-generics/extract.nft.create";
import { TryExtractUpdateMetadata } from "src/utils/transaction-generics/extract.update.metadata";

describe.only('Transaction Utils', () => {
    it('tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction', () => {
        let tryExtractSftChange: TryGenericExtract;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractSftChange = new TryExtractSftChange(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractSftChange = new TryExtractSftChange(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractSftChange = new TryExtractSftChange(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVEA0NTQ3NGM0NDRkNDU1ODQ2MmQzNjM3NjE2MzM0MzlAMTJAOWFhNjNj';
        tryExtractSftChange = new TryExtractSftChange(transaction);
        expect(tryExtractSftChange.extract()).toEqual('EGLDMEXF-67ac49');
    });

    it('tryExtractNftMetadataFromNftCreateTransaction', () => {
        let tryExtractNftCreate: TryGenericExtract;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractNftCreate = new TryExtractNftCreate(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractNftCreate = new TryExtractNftCreate(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractNftCreate = new TryExtractNftCreate(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVENyZWF0ZUA0ZTQ2NTQyZDM4MzEzMTM4Mzc2NkAwMUA0NDY1NjE2Y0BANTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjFANzQ2MTY3NzMzYTYxNzI3MjZmNzcyYzc3NzI2ZjZlNjcyYzczNjk2NzZlNjE2YzJjNzA2NTcyNjM2NTZlNzQyYzZjNjk2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDYxNzI3MDZlNDQzNjZiNDY0NTRhNjg0NzQxNWEzNzZiNGQ1OTc5MzE3NzQ4NjI0MzczNTA1MTc5NjQ3MTYyNjE1OTMzNDE1ODZkNTczMTQ4Mzk2YTYyNjJANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjE=';
        tryExtractNftCreate = new TryExtractNftCreate(transaction);
        expect(tryExtractNftCreate.extract()).toMatchObject({ collection: 'NFT-81187f', attributes: 'tags:arrow,wrong,signal,percent,lie;metadata:QmarpnD6kFEJhGAZ7kMYy1wHbCsPQydqbaY3AXmW1H9jbb' });
    });

    it('tryExtractNftIdentifierFromNftUpdateMetadataTransaction', () => {
        let tryExtractUpdateMetadata: TryGenericExtract;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractUpdateMetadata = new TryExtractUpdateMetadata(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractUpdateMetadata = new TryExtractUpdateMetadata(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractUpdateMetadata = new TryExtractUpdateMetadata(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVFVwZGF0ZUF0dHJpYnV0ZXNANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDAxQHRlc3RhdHRyaWJ1dGVz';
        tryExtractUpdateMetadata = new TryExtractUpdateMetadata(transaction);
        expect(tryExtractUpdateMetadata.extract()).toMatchObject({ identifier: 'TESTCOL-abcd-01' });
    });
});
