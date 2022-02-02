import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TransferOwnershipExtractor } from "src/crons/transaction.processor/extractor/extract.transfer.ownership";
import { NftCreateTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.create.transaction.extractor";
import { NftUpdateMetadataTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.update.attributes.transaction.extractor";
import { SftChangeTransactionExtractor } from "src/crons/transaction.processor/extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "src/crons/transaction.processor/extractor/transaction.extractor.interface";

describe('Transaction Utils', () => {
    it('tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction', () => {
        let tryExtractSftChange: TransactionExtractorInterface<string | undefined>;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractSftChange = new SftChangeTransactionExtractor();
        expect(tryExtractSftChange.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractSftChange = new SftChangeTransactionExtractor();
        expect(tryExtractSftChange.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractSftChange = new SftChangeTransactionExtractor;
        expect(tryExtractSftChange.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVEA0NTQ3NGM0NDRkNDU1ODQ2MmQzNjM3NjE2MzM0MzlAMTJAOWFhNjNj';
        tryExtractSftChange = new SftChangeTransactionExtractor();
        expect(tryExtractSftChange.extract(transaction)).toEqual('EGLDMEXF-67ac49');
    });

    it('tryExtractNftMetadataFromNftCreateTransaction', () => {
        let tryExtractNftCreate: TransactionExtractorInterface<{ collection: string, attributes: string } | undefined>;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractNftCreate = new NftCreateTransactionExtractor();
        expect(tryExtractNftCreate.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractNftCreate = new NftCreateTransactionExtractor();
        expect(tryExtractNftCreate.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractNftCreate = new NftCreateTransactionExtractor();
        expect(tryExtractNftCreate.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVENyZWF0ZUA0ZTQ2NTQyZDM4MzEzMTM4Mzc2NkAwMUA0NDY1NjE2Y0BANTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjFANzQ2MTY3NzMzYTYxNzI3MjZmNzcyYzc3NzI2ZjZlNjcyYzczNjk2NzZlNjE2YzJjNzA2NTcyNjM2NTZlNzQyYzZjNjk2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDYxNzI3MDZlNDQzNjZiNDY0NTRhNjg0NzQxNWEzNzZiNGQ1OTc5MzE3NzQ4NjI0MzczNTA1MTc5NjQ3MTYyNjE1OTMzNDE1ODZkNTczMTQ4Mzk2YTYyNjJANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjE=';
        tryExtractNftCreate = new NftCreateTransactionExtractor();
        expect(tryExtractNftCreate.extract(transaction)).toMatchObject({ collection: 'NFT-81187f', attributes: 'tags:arrow,wrong,signal,percent,lie;metadata:QmarpnD6kFEJhGAZ7kMYy1wHbCsPQydqbaY3AXmW1H9jbb' });
    });

    it('tryExtractNftIdentifierFromNftUpdateMetadataTransaction', () => {
        let tryExtractUpdateMetadata: TransactionExtractorInterface<{ identifier: string } | undefined>;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractUpdateMetadata = new NftUpdateMetadataTransactionExtractor();
        expect(tryExtractUpdateMetadata.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractUpdateMetadata = new NftUpdateMetadataTransactionExtractor();
        expect(tryExtractUpdateMetadata.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractUpdateMetadata = new NftUpdateMetadataTransactionExtractor();
        expect(tryExtractUpdateMetadata.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVFVwZGF0ZUF0dHJpYnV0ZXNANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDAxQHRlc3RhdHRyaWJ1dGVz';
        tryExtractUpdateMetadata = new NftUpdateMetadataTransactionExtractor();
        expect(tryExtractUpdateMetadata.extract(transaction)).toMatchObject({ identifier: 'TESTCOL-abcd-01' });
    });

    it('tryExtractTransferOwnership', () => {
        let tryExtractTransferOwnership: TransactionExtractorInterface<{ identifier: string }>;

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        tryExtractTransferOwnership = new TransferOwnershipExtractor();
        expect(tryExtractTransferOwnership.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        tryExtractTransferOwnership = new TransferOwnershipExtractor();
        expect(tryExtractTransferOwnership.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        tryExtractTransferOwnership = new TransferOwnershipExtractor();
        expect(tryExtractTransferOwnership.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVFVwZGF0ZUF0dHJpYnV0ZXNANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDAxQHRlc3RhdHRyaWJ1dGVz';
        tryExtractTransferOwnership = new TransferOwnershipExtractor();
        expect(tryExtractTransferOwnership.extract(transaction)).toBeUndefined();


        transaction = new ShardTransaction();
        transaction.data = 'dHJhbnNmZXJPd25lcnNoaXBANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDFhNmI3Njc5ZmQxZjFhODE3MjBmMjZlNzM4NGYxNTBlZmVmOTU4OGU0MjhkMjYwYTFmNDNmNjJhY2U2YTVhM2M=';
        tryExtractTransferOwnership = new TransferOwnershipExtractor();
        expect(tryExtractTransferOwnership.extract(transaction)).toMatchObject({ identifier: 'TESTCOL-abcd' });
    });
});
