import { Test } from '@nestjs/testing';
import { TransactionStatus } from 'src/endpoints/transactions/entities/transaction.status';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import transactionDetails from "../data/transactions/transaction.details";
import { TransferModule } from 'src/endpoints/transfers/transfer.module';
import { TransferService } from 'src/endpoints/transfers/transfer.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { BinaryUtils } from 'src/utils/binary.utils';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';

describe.skip('Transfer Service', () => {
  let transferService: TransferService;
  let apiConfigService: ApiConfigService;
  let transactionSender: string;
  let transactionReceiver: string;

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [TransferModule, ApiConfigModule],
    }).compile();

    transferService = moduleRef.get<TransferService>(TransferService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    const transactionFilter = new TransactionFilter();

    const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 1 }, '');
    expect(transfers).toHaveLength(1);

    const transfer = transfers[0];
    transactionSender = transfer.sender;
    transactionReceiver = transfer.receiver;

  }, Constants.oneHour() * 1000);

  describe('Transfers list', () => {
    describe('Transfers pagination', () => {
      it(`should return a list with 25 transfers`, async () => {
        const transfers = await transferService.getTransfers(new TransactionFilter(), { from: 0, size: 25 }, '');

        expect(transfers).toHaveLength(25);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
        }
      });

      it(`should return a list with 100 transfers`, async () => {
        const transfers = await transferService.getTransfers(new TransactionFilter(), { from: 0, size: 100 }, '');

        expect(transfers).toHaveLength(100);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
        }
      });
    });

    describe('Transfers filters', () => {
      it(`should return a list of transfers between two accounts`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = transactionSender;
        transactionFilter.receiver = transactionReceiver;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.sender).toBe(transactionSender);
          expect(transfer.receiver).toBe(transactionReceiver);
        }
      });

      it(`should return a list with pending transfers`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.status = TransactionStatus.pending;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.status).toBe(TransactionStatus.pending);
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
        }
      });

      it(`should return a list with transfers in one date range`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559162;
        transactionFilter.after = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transfer.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return a list with transfers after one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
        }
      });

      it(`should return a list with transfers before one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return transfers for an address`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, address);
        expect(transfers).toBeInstanceOf(Array);
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.sender === address && transfer.receiver === address).toBe(true);
        }

        const accountTransactionsList = await transferService.getTransfers(new TransactionFilter(), { from: 0, size: 25 }, address);
        expect(transfers).toEqual(accountTransactionsList);
      });

      it(`should return transfers for an address with self transactions`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = address;
        transactionFilter.receiver = address;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, address);
        expect(transfers).toBeInstanceOf(Array);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.sender === address && transfer.receiver === address);
        }
      });

      it(`should return a list with transfers where an address is sender, in one date range, with success status`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;
        transactionFilter.sender = address;
        transactionFilter.status = TransactionStatus.success;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers).toBeInstanceOf(Array);
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer).toHaveStructure(Object.keys(new Transaction()));
          expect(transfer.sender).toBe(address);
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transfer.status).toBe(TransactionStatus.success);
        }
      });

      it('should return a list with transfers that call ESDTNFTTransfer function', async () => {
        if (apiConfigService.getIsIndexerV3FlagActive()) {
          const transactionFilter = new TransactionFilter();
          transactionFilter.function = 'ESDTNFTTransfer';

          const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');

          for (const transfer of transfers) {
            expect(transfer).toHaveStructure(Object.keys(new Transaction()));
            expect(BinaryUtils.base64Decode(transfer.data).startsWith('ESDTNFTTransfer')).toBe(true);
          }
        }
      });

      it(`should return transfers with specific hashes`, async () => {
        const hashes = [
          '8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182',
          '56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777',
          'INVALIDTXHASH',
        ];
        const transactionFilter = new TransactionFilter();
        transactionFilter.hashes = hashes;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, '');
        expect(transfers).toHaveLength(2);
        const transactionsHashes = transfers.map(({ txHash }) => txHash);
        expect(transactionsHashes.includes('8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182'));
        expect(transactionsHashes.includes('56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777'));
        expect(!transactionsHashes.includes('INVALIDTXHASH'));
      });

    });
  });

  describe('Transfers count', () => {
    it(`should return transfers count based on token indentifier`, async () => {
      const transactionFilter = new TransactionFilter();
      transactionFilter.token = transactionDetails.tokenIdentifier;

      const count = await transferService.getTransfersCount(transactionFilter, '');
      expect(typeof count).toBe('number');
    });
  });
});
