import { Test } from "@nestjs/testing";
import tokenDetails from "src/test/data/esdt/token/token.example";
import { PublicAppModule } from "src/public.app.module";
import { TransactionLogEvent } from "src/endpoints/transactions/entities/transaction.log.event";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionOperationAction } from "src/endpoints/transactions/entities/transaction.operation.action";
import { TransactionOperationType } from "src/endpoints/transactions/entities/transaction.operation.type";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { TokenTransferService } from "src/endpoints/tokens/token.transfer.service";
import transactionsWithLogs from "src/test/data/transactions/transactions.with.logs";

describe('Token Transfer Service', () => {
  let tokenTransferService: TokenTransferService;

  const txHash: string = '0a89f1b739e0d522d80159bfd3ba8565d04b175c704559898d0fb024a64aa48d';
  const tokenIdentifier: string = 'RIDE-7d18e9';
  const sender: string = 'erd1hz65lr7ry7sa3p8jjeplwzujm2d7ktj7s6glk9hk8f4zj8znftgqaey5f5';
  let transaction: TransactionDetailed;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    tokenTransferService = moduleRef.get<TokenTransferService>(TokenTransferService);

    transaction = new TransactionDetailed();
    transaction.txHash = txHash;
    transaction.sender = sender;
  });

  describe('Get Operations For Transaction Logs', () => {
    it('should return operations for transaction logs', async () => {
      const operations = await tokenTransferService.getOperationsForTransaction(transaction, transactionsWithLogs);

      for (const operation of operations) {
        expect(operation).toHaveProperty('action');
        expect(operation).toHaveProperty('identifier');
        expect(operation).toHaveProperty('receiver');
        expect(operation).toHaveProperty('sender');
        expect(operation).toHaveProperty('type');
        expect(operation).toHaveProperty('value');
      }
    });

    it('should return operations for a local mint event', async () => {
      const localMintEvent = new TransactionLogEvent();
      localMintEvent.address = 'erd1qqqqqqqqqqqqqpgqg8a36rqxu4ch5v2522jv5avlun94sdv80n4sygxs94';
      localMintEvent.identifier = 'ESDTLocalMint';
      localMintEvent.topics = [
        "V0VHTEQtYmQ0ZDc5",
        "",
        "AWNFeF2KAAA=",
      ];
      const log = new TransactionLog();
      log.events = [localMintEvent];

      const operations = await tokenTransferService.getOperationsForTransaction(transaction, [log]);

      expect(operations.length).toStrictEqual(1);

      for (const operation of operations) {
        expect(operation.action).toStrictEqual(TransactionOperationAction.localMint);
        expect(operation.type).toStrictEqual(TransactionOperationType.esdt);
        expect(operation.identifier).toStrictEqual('WEGLD-bd4d79');
      }
    });


    it('should return operations for a transfer event', async () => {
      const transferEvent = new TransactionLogEvent();
      transferEvent.address = 'erd1qqqqqqqqqqqqqpgqg8a36rqxu4ch5v2522jv5avlun94sdv80n4sygxs94';
      transferEvent.identifier = 'ESDTTransfer';
      transferEvent.topics = [
        "V0VHTEQtYmQ0ZDc5",
        "",
        "AWNFeF2KAAA=",
        "iMc4pdJsDjorT56BELVA7pwLcaO+BXVppaew/LSCyPc=",
      ];
      const log = new TransactionLog();
      log.events = [transferEvent];

      const operations = await tokenTransferService.getOperationsForTransaction(transaction, [log]);

      expect(operations.length).toStrictEqual(1);

      for (const operation of operations) {
        expect(operation.action).toStrictEqual(TransactionOperationAction.transfer);
        expect(operation.type).toStrictEqual(TransactionOperationType.esdt);
        expect(operation.identifier).toStrictEqual('WEGLD-bd4d79');
      }
    });


    it('should return operations for a write log event', async () => {
      const writeLogEvent = new TransactionLogEvent();
      writeLogEvent.address = 'erd1qqqqqqqqqqqqqpgqg8a36rqxu4ch5v2522jv5avlun94sdv80n4sygxs94';
      writeLogEvent.identifier = 'writeLog';
      writeLogEvent.topics = [
        "iMc4pdJsDjorT56BELVA7pwLcaO+BXVppaew/LSCyPc=",
        "QHRvbyBtdWNoIGdhcyBwcm92aWRlZDogZ2FzIG5lZWRlZCA9IDIwOTcyNTUsIGdhcyByZW1haW5lZCA9IDExNzkwMjc0NQ==",
      ];
      writeLogEvent.data = "QDZmNmI=";
      const log = new TransactionLog();
      log.events = [writeLogEvent];

      const operations = await tokenTransferService.getOperationsForTransaction(transaction, [log]);

      expect(operations.length).toStrictEqual(1);

      for (const operation of operations) {
        expect(operation.action).toStrictEqual(TransactionOperationAction.writeLog);
        expect(operation.type).toStrictEqual(TransactionOperationType.log);
        expect(operation.message).toStrictEqual("@too much gas provided: gas needed = 2097255, gas remained = 117902745");
      }
    });


    it('should return operations for a signal error event', async () => {
      const signalErrorEvent = new TransactionLogEvent();
      signalErrorEvent.address = 'erd1qqqqqqqqqqqqqpgqg8a36rqxu4ch5v2522jv5avlun94sdv80n4sygxs94';
      signalErrorEvent.identifier = 'signalError';
      signalErrorEvent.topics = [
        "umboqRYjZyO/H5SZZIi2/FfcX27AUSubdLU+9l+VCMs=",
        "ZXJyb3Igc2lnbmFsbGVkIGJ5IHNtYXJ0Y29udHJhY3Q=",
      ],
        signalErrorEvent.data = "QDY1Nzg2NTYzNzU3NDY5NmY2ZTIwNjY2MTY5NmM2NTY0";
      const log = new TransactionLog();
      log.events = [signalErrorEvent];

      const operations = await tokenTransferService.getOperationsForTransaction(transaction, [log]);
      expect(operations.length).toStrictEqual(1);

      for (const operation of operations) {
        expect(operation.action).toStrictEqual(TransactionOperationAction.signalError);
        expect(operation.type).toStrictEqual(TransactionOperationType.error);
        expect(operation.message).toStrictEqual("error signalled by smartcontract");
      }
    });


    it('should return operations for a egld transfer from smart contract result', async () => {
      const scr = new SmartContractResult();
      scr.value = "6761736710959745";
      scr.nonce = 0;
      scr.sender = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqghllllsku0nzf";
      scr.receiver = "erd1pln7dkvselu5hmx3qs9elzfaln96k30x0j6ypnh8gsnyvklanxsqmujqq7";
      transaction.results = [scr];

      const operations = await tokenTransferService.getOperationsForTransaction(transaction, []);
      expect(operations.length).toStrictEqual(1);

      for (const operation of operations) {
        expect(operation.action).toStrictEqual(TransactionOperationAction.transfer);
        expect(operation.type).toStrictEqual(TransactionOperationType.egld);
      }
    });

    describe('Get Token Transfer Properties', () => {
      it('should return token transfer properties', async () => {
        const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
        if (!properties) {
          throw new Error('Properties are not defined');
        }

        expect(properties).toHaveProperty('type');
        expect(properties).toHaveProperty('ticker');
        expect(properties).toHaveProperty('name');
        expect(properties).toHaveProperty('svgUrl');
      });

      it('token transfer should have "TokenTransferProperties"', async () => {
        const properties = await tokenTransferService.getTokenTransferProperties(tokenIdentifier);
        if (!properties) {
          throw new Error('Properties not defined');
        }

        expect(properties.type).toBeDefined;
        expect(properties.name).toBeDefined;
        expect(properties.token).toBeDefined;
        expect(properties.decimals).toBeDefined;
      });
    });

    describe('Get Token Transfer Properties Raw', () => {
      it('should return token transfer properties raw based on identifier', async () => {
        const properties = await tokenTransferService.getTokenTransferPropertiesRaw(tokenDetails.identifier);
        if (!properties) {
          throw new Error('Properties not defined');
        }

        expect(properties.name).toBe(tokenDetails.name);
        expect(properties.type).toBe(tokenDetails.type);
        expect(properties.token).toBe(tokenDetails.identifier);
        expect(properties.decimals).toBe(tokenDetails.decimals);
      });
    });
  });
});

