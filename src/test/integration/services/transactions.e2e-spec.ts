import { Test } from '@nestjs/testing';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { TransactionStatus } from 'src/endpoints/transactions/entities/transaction.status';
import { TransactionService } from 'src/endpoints/transactions/transaction.service';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import { TransactionOptionalFieldOption } from 'src/endpoints/transactions/entities/transaction.optional.field.options';
import transactionDetails from "src/test/data/transactions/transaction.details";
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { PublicAppModule } from 'src/public.app.module';
import { BinaryUtils } from '@elrondnetwork/erdnest';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';

describe('Transaction Service', () => {
  let transactionService: TransactionService;
  let apiConfigService: ApiConfigService;
  let transactionHash: string;
  let transactionSender: string;
  let transactionReceiver: string;
  const detailedTransactionHash: string = '18128acfd3f19f7a747ccf02bc866e95aa2db92af44fed2f9ed2c2102223b462';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    transactionService = moduleRef.get<TransactionService>(TransactionService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    const transactionFilter = new TransactionFilter();

    const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 1 });
    expect(transactions).toHaveLength(1);

    const transaction = transactions[0];
    transactionHash = transaction.txHash;
    transactionSender = transaction.sender;
    transactionReceiver = transaction.receiver;
  });

  describe('Transactions list', () => {
    describe('Transactions pagination', () => {
      it(`should return a list with 25 transactions`, async () => {
        const transactions = await transactionService.getTransactions(new TransactionFilter(), { from: 0, size: 25 });

        expect(transactions).toHaveLength(25);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
        }
      });

      it(`should return a list with 100 transactions`, async () => {
        const transactions = await transactionService.getTransactions(new TransactionFilter(), { from: 0, size: 100 });

        expect(transactions).toHaveLength(100);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
        }
      });
    });

    describe('Transactions filters', () => {
      it(`should return a list of transactions between two accounts, where sender must be one address`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = transactionSender;
        transactionFilter.receivers = [transactionReceiver];

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.sender).toBe(transactionSender);
          expect([transactionSender, transactionReceiver]).toContain(transaction.receiver);
        }
      });

      it(`should return a list of transactions for one address`, async () => {
        const address = 'erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry';
        const transactions = await transactionService.getTransactions(new TransactionFilter(), { from: 0, size: 25 }, undefined, address);

        for (const transaction of transactions) {
          expect([transaction.sender, transaction.receiver]).toContain(address);
        }
      });

      it(`should return a list of transactions for one address to a specific receiver`, async () => {
        const address = 'erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry';
        const receiver = ['erd19lurqh6alll7znp659ne2v7r4w7khepfwlluvkr0l9y896se97mqak0j5e'];
        const transactions = await transactionService.getTransactions(new TransactionFilter({ receivers: receiver }), { from: 0, size: 25 }, undefined, address);

        for (const transaction of transactions) {
          expect(transaction.sender).toStrictEqual(address);
          expect(receiver).toContain(transaction.receiver);
        }
      });

      it(`should return a list of transactions for one address to a list of receivers`, async () => {
        const address = 'erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry';
        const receiver = ['erd19lurqh6alll7znp659ne2v7r4w7khepfwlluvkr0l9y896se97mqak0j5e', 'erd1gsw3q3cp8axfy08um6xpd8rxsn0j27ec2slc6v0z05kqslgknzksl68gg5'];
        const transactions = await transactionService.getTransactions(new TransactionFilter({ receivers: receiver }), { from: 0, size: 25 }, undefined, address);

        for (const transaction of transactions) {
          expect(transaction.sender).toStrictEqual(address);
          expect(receiver).toContain(transaction.receiver);
        }
      });

      it(`should return a list of transactions for one address where the address is receiver`, async () => {
        const address = 'erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry';
        const receiver = ['erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry'];
        const transactions = await transactionService.getTransactions(new TransactionFilter({ receivers: receiver }), { from: 0, size: 25 }, undefined, address);

        for (const transaction of transactions) {
          expect(transaction.receiver).toStrictEqual(address);
        }
      });

      it('should return a list with transfers that call ESDTNFTTransfer function', async () => {
        if (apiConfigService.getIsIndexerV3FlagActive()) {
          const transactionFilter = new TransactionFilter();
          transactionFilter.function = 'ESDTNFTTransfer';
          transactionFilter.status = TransactionStatus.success;

          const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });

          for (const transaction of transactions) {
            expect(transaction).toHaveStructure(Object.keys(new Transaction()));
            expect(BinaryUtils.base64Decode(transaction.data ?? '').startsWith('ESDTNFTTransfer')).toBe(true);
          }
        }
      });

      it(`should return a list with pending transactions`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.status = TransactionStatus.pending;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction.status).toBe(TransactionStatus.pending);
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
        }
      });

      it(`should return a list with transactions in one date range`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559162;
        transactionFilter.after = 1625559108;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transaction.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return a list with transactions after one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
        }
      });

      it(`should return a list with transactions before one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559108;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return transactions for an address with self transactions`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = address;
        transactionFilter.receivers = [address];

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 }, undefined, address);
        expect(transactions).toBeInstanceOf(Array);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.sender === address && transaction.receiver === address);
        }
      });

      it(`should return a list with transactions where an address is sender, in one date range, with success status`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;
        transactionFilter.sender = address;
        transactionFilter.status = TransactionStatus.success;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions).toBeInstanceOf(Array);
        expect(transactions.length).toBeGreaterThan(0);

        for (const transaction of transactions) {
          expect(transaction).toHaveStructure(Object.keys(new Transaction()));
          expect(transaction.sender).toBe(address);
          expect(transaction.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transaction.status).toBe(TransactionStatus.success);
        }
      });

      it(`should return transactions with specific hashes`, async () => {
        const hashes = [
          '8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182',
          '56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777',
          'INVALIDTXHASH',
        ];
        const transactionFilter = new TransactionFilter();
        transactionFilter.hashes = hashes;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        expect(transactions).toHaveLength(2);
        const transactionsHashes = transactions.map(({ txHash }) => txHash);
        expect(transactionsHashes.includes('8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182'));
        expect(transactionsHashes.includes('56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777'));
        expect(!transactionsHashes.includes('INVALIDTXHASH'));
      });

      it(`should return transaction details based on receiver filter`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.token = transactionDetails.tokenIdentifier;
        transactionFilter.receivers = [transactionDetails.receiver];

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 1 });
        for (const transaction of transactions) {
          expect(transaction).toBeDefined();
          expect(transaction.txHash).toEqual(transactionDetails.txHash);
          expect(transaction.sender).toEqual(transactionDetails.sender);
        }
      });

      it(`should return transaction details based on receivers filter`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.receivers = ["erd16x7le8dpkjsafgwjx0e5kw94evsqw039rwp42m2j9eesd88x8zzs75tzry", "erd1hzccjg25yqaqnr732x2ka7pj5glx72pfqzf05jj9hxqn3lxkramq5zu8h4"];

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 10 });
        for (const transaction of transactions) {
          expect(transaction).toBeDefined();
          expect(transactionFilter.receivers).toContain(transaction.receiver);
        }
      });

      it("should return transaction details based on sender, receiver and miniblock", async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = transactionDetails.sender;
        transactionFilter.receivers = [transactionDetails.receiver];
        transactionFilter.senderShard = transactionDetails.senderShard;
        transactionFilter.miniBlockHash = transactionDetails.miniBlockHash;

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 1 });
        for (const transaction of transactions) {
          expect(transaction.sender).toStrictEqual(transactionDetails.sender);
          expect(transaction.receiver).toStrictEqual(transactionDetails.receiver);
          expect(transaction.senderShard).toStrictEqual(transactionDetails.senderShard);
          expect(transaction.miniBlockHash).toStrictEqual(transactionDetails.miniBlockHash);
        }
      });

      it(`should return transactions details with "function" filter applied`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.function = "sendOffer";

        const transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
        for (const transaction of transactions) {
          expect(transaction.function).toStrictEqual("sendOffer");
        }
      });
    });
  });

  describe('Transaction count', () => {
    it(`should return transaction count based on token indentifier`, async () => {
      const transactionFilter = new TransactionFilter();
      transactionFilter.token = transactionDetails.tokenIdentifier;

      const count = await transactionService.getTransactionCount(transactionFilter);
      expect(typeof count).toBe('number');
    });
  });

  describe('Specific transaction', () => {
    it(`should return a transaction for a specific hash`, async () => {
      const transaction = await transactionService.getTransaction(transactionDetails.txHash);
      expect(transaction).toHaveStructure(Object.keys(new TransactionDetailed()));
    });

    it(`should return a transaction for a specific hash with results optional field`, async () => {
      const transaction = await transactionService.getTransaction(transactionDetails.txHash, [TransactionOptionalFieldOption.results]);
      if (!transaction) {
        throw new Error('Transaction must be defined');
      }

      expect(transaction).toHaveStructure(Object.keys(new TransactionDetailed()));
    });

    it(`should return a transaction for a specific hash with results and logs optional fields`, async () => {
      const transaction = await transactionService.getTransaction(detailedTransactionHash, [TransactionOptionalFieldOption.results, TransactionOptionalFieldOption.logs]);
      if (!transaction) {
        throw new Error('Transaction must be defined');
      }

      expect(transaction).toHaveStructure(Object.keys(new TransactionDetailed()));
    });

    it(`should throw 'Transaction not found' error`, async () => {
      const transaction = await transactionService.getTransaction(transactionHash + 'a');
      expect(transaction).toBeNull();
    });
  });

  describe('Get Transaction Count For Address', () => {
    it('should return transaction count for address', async () => {
      const address = transactionDetails.sender;
      const count = await transactionService.getTransactionCountForAddress(address);
      return expect(typeof count).toBe('number');
    });
  });

  describe('Get Transaction Count For Address Raw', () => {
    it('should return transaction count for address raw', async () => {
      const addressRaw = transactionDetails.sender;
      const count = await transactionService.getTransactionCountForAddressRaw(addressRaw);
      return expect(typeof count).toBe('number');
    });
  });
});
