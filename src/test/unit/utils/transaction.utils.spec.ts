import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TransferOwnershipExtractor } from "src/crons/transaction.processor/extractor/transfer.ownership.extractor";
import { NftCreateTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.create.transaction.extractor";
import { NftUpdateAttributesTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.update.attributes.transaction.extractor";
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
        const extractor = new NftCreateTransactionExtractor();

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVENyZWF0ZUA0ZTQ2NTQyZDM4MzEzMTM4Mzc2NkAwMUA0NDY1NjE2Y0BANTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjFANzQ2MTY3NzMzYTYxNzI3MjZmNzcyYzc3NzI2ZjZlNjcyYzczNjk2NzZlNjE2YzJjNzA2NTcyNjM2NTZlNzQyYzZjNjk2NTNiNmQ2NTc0NjE2NDYxNzQ2MTNhNTE2ZDYxNzI3MDZlNDQzNjZiNDY0NTRhNjg0NzQxNWEzNzZiNGQ1OTc5MzE3NzQ4NjI0MzczNTA1MTc5NjQ3MTYyNjE1OTMzNDE1ODZkNTczMTQ4Mzk2YTYyNjJANjg3NDc0NzA3MzNhMmYyZjY5NzA2NjczMmU2OTZmMmY2OTcwNjY3MzJmNTE2ZDU5NDc2MTZkNDE0YjMxNWE2MjU2NmE2ZDRjMzk1NTM5NDc3ODY2Nzg2MjU0NDg2YTQ3NzMzNzc0MzUzNTY0NDY3MTRhNWE0YTQyNGE3MTUzNmY2NTZiNjE=';
        expect(extractor.extract(transaction)).toMatchObject({ collection: 'NFT-81187f' });
    });

    it('canDetectNftCreateFromLogs', () => {
        const extractor = new NftCreateTransactionExtractor();

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        expect(extractor.canDetectNftCreateTransactionFromLogs(transaction)).toBe(false);

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        expect(extractor.canDetectNftCreateTransactionFromLogs(transaction)).toBe(false);

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        transaction.sender = 'erd13wtw8k3vch93g5w74a7x35kld2hqm73kcn644l49669qr425wyfquyk02a';
        transaction.receiver = 'erd1qqqqqqqqqqqqqpgq95786n3gs5ddqxvwhtdyjepep740xqrkys5swtr2gm';
        expect(extractor.canDetectNftCreateTransactionFromLogs(transaction)).toBe(false);

        transaction = new ShardTransaction();
        transaction.sender = 'erd13wtw8k3vch93g5w74a7x35kld2hqm73kcn644l49669qr425wyfquyk02a';
        transaction.receiver = 'erd1qqqqqqqqqqqqqpgq95786n3gs5ddqxvwhtdyjepep740xqrkys5swtr2gm';
        transaction.data = 'YnV5QDUzNzU2MjYzNjE3MjcwNjE3NDY5NGY0NzczQDAx';
        expect(extractor.canDetectNftCreateTransactionFromLogs(transaction)).toBe(true);
    });

    it('tryExtractNftIdentifierFromNftUpdateMetadataTransaction', () => {
        const extractor = new NftUpdateAttributesTransactionExtractor();

        let transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'Y2hhbmdlU0ZUVG9NZXRhRVNEVA==';
        expect(extractor.extract(transaction)).toBeUndefined();

        transaction = new ShardTransaction();
        transaction.data = 'RVNEVE5GVFVwZGF0ZUF0dHJpYnV0ZXNANTQ0NTUzNTQ0MzRmNGMyZDYxNjI2MzY0QDAxQHRlc3RhdHRyaWJ1dGVz';
        expect(extractor.extract(transaction)).toMatchObject({ identifier: 'TESTCOL-abcd-01' });
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
