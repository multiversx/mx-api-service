import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TransactionExtractorInterface } from "src/utils/transaction-generics/transaction.extractor.interface";
import { SftChangeTransactionExtractor } from "src/utils/transaction-generics/sft.change.transaction.extractor";
import { NftCreateTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.create.transaction.extractor";
import { UpdateMetadataTransactionExtractor } from "src/utils/transaction-generics/update.metadata.transaction.extractor";

describe.only('Transaction Utils', () => {
    it('tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction', () => {
        let tryExtractSftChange: TransactionExtractorInterface;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractSftChange = new SftChangeTransactionExtractor(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractSftChange = new SftChangeTransactionExtractor(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractSftChange = new SftChangeTransactionExtractor(transaction);
        expect(tryExtractSftChange.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVEA0NTQ3NGM0NDRkNDU1ODQ2MmQzNjM3NjE2MzM0MzlAMTJAOWFhNjNj';
        tryExtractSftChange = new SftChangeTransactionExtractor(transaction);
        expect(tryExtractSftChange.extract()).toEqual('EGLDMEXF-67ac49');
    });

    it('tryExtractNftMetadataFromNftCreateTransaction', () => {
        let tryExtractNftCreate: TransactionExtractorInterface;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractNftCreate = new NftCreateTransactionExtractor(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractNftCreate = new NftCreateTransactionExtractor(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractNftCreate = new NftCreateTransactionExtractor(transaction);
        expect(tryExtractNftCreate.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVENyZWF0ZUA0ZTQ2NTQyZDM4MzEzMTM4Mzc2NkAwMUA0NDY1NjE2Y0BANTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjFANzQ2MTY3NzMzYTYxNzI3MjZmNzcyYzc3NzI2ZjZlNjcyYzczNjk2NzZlNjE2YzJjNzA2NTcyNjM2NTZlNzQyYzZjNjk2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDYxNzI3MDZlNDQzNjZiNDY0NTRhNjg0NzQxNWEzNzZiNGQ1OTc5MzE3NzQ4NjI0MzczNTA1MTc5NjQ3MTYyNjE1OTMzNDE1ODZkNTczMTQ4Mzk2YTYyNjJANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjE=';
        tryExtractNftCreate = new NftCreateTransactionExtractor(transaction);
        expect(tryExtractNftCreate.extract()).toMatchObject({ collection: 'NFT-81187f', attributes: 'tags:arrow,wrong,signal,percent,lie;metadata:QmarpnD6kFEJhGAZ7kMYy1wHbCsPQydqbaY3AXmW1H9jbb' });
    });

    it('tryExtractNftIdentifierFromNftUpdateMetadataTransaction', () => {
        let tryExtractUpdateMetadata: TransactionExtractorInterface;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractUpdateMetadata = new UpdateMetadataTransactionExtractor(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractUpdateMetadata = new UpdateMetadataTransactionExtractor(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractUpdateMetadata = new UpdateMetadataTransactionExtractor(transaction);
        expect(tryExtractUpdateMetadata.extract()).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVFVwZGF0ZUF0dHJpYnV0ZXNANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDAxQHRlc3RhdHRyaWJ1dGVz';
        tryExtractUpdateMetadata = new UpdateMetadataTransactionExtractor(transaction);
        expect(tryExtractUpdateMetadata.extract()).toMatchObject({ identifier: 'TESTCOL-abcd-01' });
    });
});
