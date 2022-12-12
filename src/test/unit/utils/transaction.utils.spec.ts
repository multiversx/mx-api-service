import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { TransferOwnershipExtractor } from "src/crons/transaction.processor/extractor/transfer.ownership.extractor";
import { NftCreateTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.create.transaction.extractor";
import { NftUpdateAttributesTransactionExtractor } from "src/crons/transaction.processor/extractor/nft.update.attributes.transaction.extractor";
import { SftChangeTransactionExtractor } from "src/crons/transaction.processor/extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "src/crons/transaction.processor/extractor/transaction.extractor.interface";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionLogEvent } from "src/endpoints/transactions/entities/transaction.log.event";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";
import { TransactionOperationAction } from "src/endpoints/transactions/entities/transaction.operation.action";
import { TransactionOperationType } from "src/endpoints/transactions/entities/transaction.operation.type";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { TransactionUtils } from "src/endpoints/transactions/transaction.utils";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';

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

  it('tryExtractNftMetadataFromNftCreateTransaction from transaction', () => {
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

  it('tryExtractNftMetadataFromNftCreateTransaction from detailed transaction logs', () => {
    const extractor = new NftCreateTransactionExtractor();

    //Transaction does not have logs
    let transaction = new ShardTransaction();
    const transactionDetailed = new TransactionDetailed();
    transaction.data = 'dGVzdFRyYW5zYWN0aW9u';
    expect(extractor.extract(transaction, transactionDetailed)).toBeUndefined();

    //Event identifier isn't ESDTNFTCreate
    transaction = new ShardTransaction();
    transaction.data = 'dGVzdFRyYW5zYWN0aW9uQA==';
    transactionDetailed.logs = new TransactionLog();
    const event = new TransactionLogEvent();
    event.identifier = 'ESDTNFTTransfer';
    event.topics = [
      "T0dTLTNmMTQwOA==",
      "Jvk=",
      "AQ==",
      "CAESAgABIrwDCPlNEhNTdWJjYXJwYXRpIE9HICM5OTc3GiAAAAAAAAAAAAUALTx9TiiFGtAZjrraSWQ5D6rzAHYkKSDoByouUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbTJMaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbS82MjA0LnBuZzJNaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbS82MjA0Lmpzb24yU2h0dHBzOi8vaXBmcy5pby9pcGZzL1FtWEVEdVltVFRHeW9TaXY1QXhUZGVMQnR0YnZGRXFabWU4dnhlWTlCNlhOTG0vY29sbGVjdGlvbi5qc29uOlt0YWdzOlN1YmNhcnBhdGksT0dzLE11c2ljO21ldGFkYXRhOlFtWEVEdVltVFRHeW9TaXY1QXhUZGVMQnR0YnZGRXFabWU4dnhlWTlCNlhOTG0vNjIwNC5qc29u",
    ];
    transactionDetailed.logs.events = [new TransactionLogEvent(), event];
    expect(extractor.extract(transaction)).toBeUndefined();

    //Transaction has an event that sugests it is and ESDTNFTCreate transaction
    transaction = new ShardTransaction();
    event.identifier = 'ESDTNFTCreate';
    event.topics = [
      "T0dTLTNmMTQwOA==",
      "Jvk=",
      "AQ==",
      "CAESAgABIrwDCPlNEhNTdWJjYXJwYXRpIE9HICM5OTc3GiAAAAAAAAAAAAUALTx9TiiFGtAZjrraSWQ5D6rzAHYkKSDoByouUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbTJMaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbS82MjA0LnBuZzJNaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1YRUR1WW1UVEd5b1NpdjVBeFRkZUxCdHRidkZFcVptZTh2eGVZOUI2WE5MbS82MjA0Lmpzb24yU2h0dHBzOi8vaXBmcy5pby9pcGZzL1FtWEVEdVltVFRHeW9TaXY1QXhUZGVMQnR0YnZGRXFabWU4dnhlWTlCNlhOTG0vY29sbGVjdGlvbi5qc29uOlt0YWdzOlN1YmNhcnBhdGksT0dzLE11c2ljO21ldGFkYXRhOlFtWEVEdVltVFRHeW9TaXY1QXhUZGVMQnR0YnZGRXFabWU4dnhlWTlCNlhOTG0vNjIwNC5qc29u",
    ];
    transactionDetailed.logs.events = [new TransactionLogEvent(), event];
    expect(extractor.extract(transaction, transactionDetailed)).toMatchObject({ collection: 'OGS-3f1408' });

    //Transaction does not have any event that sugests it is and ESDTNFTCreate transaction
    transaction = new ShardTransaction();
    transactionDetailed.logs.events = [new TransactionLogEvent(), new TransactionLogEvent()];
    expect(extractor.extract(transaction, transactionDetailed)).toBeUndefined();
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

  it('trimOperations', () => {
    const operations: TransactionOperation[] = [
      new TransactionOperation({
        id: "f592405c4d6556a5a680c3225ae7bd254b73c7c47cf032ec66936dbbb494ca4c",
        action: TransactionOperationAction.transfer,
        type: TransactionOperationType.esdt,
        esdtType: EsdtType.FungibleESDT,
        identifier: "WUSDC-91dfa4",
        name: "WrappedUSDC",
        sender: "erd1qqqqqqqqqqqqqpgqxe80hegndzmp25c2qnsutze45h8q7nlud8ssplfp8u",
        receiver: "erd1f04mhj7mjedkd4snav6zpyjtlgqpnp8hv5ex4sw38wck9ep09s8qhh5k5v",
        value: "25000000",
        decimals: 6,
      }),
      new TransactionOperation({
        id: "2199b2f2ebf591e1d05ee3c871546cffdc1eb4970a54eee707614aa9374935c0",
        action: TransactionOperationAction.transfer,
        type: TransactionOperationType.esdt,
        esdtType: EsdtType.FungibleESDT,
        identifier: "WUSDC-91dfa4",
        name: "WrappedUSDC",
        sender: "erd1qqqqqqqqqqqqqpgqxe80hegndzmp25c2qnsutze45h8q7nlud8ssplfp8u",
        receiver: "erd1f04mhj7mjedkd4snav6zpyjtlgqpnp8hv5ex4sw38wck9ep09s8qhh5k5v",
        value: "25000000",
        decimals: 6,
      }),
    ];

    const previousHashes = {
      '2199b2f2ebf591e1d05ee3c871546cffdc1eb4970a54eee707614aa9374935c0': 'f592405c4d6556a5a680c3225ae7bd254b73c7c47cf032ec66936dbbb494ca4c',
    };

    const trimmedOperations = TransactionUtils.trimOperations('erd1qqqqqqqqqqqqqpgqxe80hegndzmp25c2qnsutze45h8q7nlud8ssplfp8u', operations, previousHashes);

    expect(trimmedOperations.length).toStrictEqual(1);
    expect(trimmedOperations[0]).toEqual({
      id: "f592405c4d6556a5a680c3225ae7bd254b73c7c47cf032ec66936dbbb494ca4c",
      action: TransactionOperationAction.transfer,
      type: TransactionOperationType.esdt,
      esdtType: EsdtType.FungibleESDT,
      identifier: "WUSDC-91dfa4",
      name: "WrappedUSDC",
      sender: "erd1qqqqqqqqqqqqqpgqxe80hegndzmp25c2qnsutze45h8q7nlud8ssplfp8u",
      receiver: "erd1f04mhj7mjedkd4snav6zpyjtlgqpnp8hv5ex4sw38wck9ep09s8qhh5k5v",
      value: "25000000",
      decimals: 6,
      receiverAssets: undefined,
      senderAssets: undefined,
      ticker: "",
    });
  });
});
