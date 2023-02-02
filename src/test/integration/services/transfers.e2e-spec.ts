import { Test } from '@nestjs/testing';
import { TransactionStatus } from 'src/endpoints/transactions/entities/transaction.status';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import transactionDetails from "src/test/data/transactions/transaction.details";
import { TransferModule } from 'src/endpoints/transfers/transfer.module';
import { TransferService } from 'src/endpoints/transfers/transfer.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { BinaryUtils, Constants, ElasticQuery, ElasticService } from '@multiversx/sdk-nestjs';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';
import { QueryPagination } from 'src/common/entities/query.pagination';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/jest.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/number.extensions';

describe('Transfer Service', () => {
  let transferService: TransferService;
  let apiConfigService: ApiConfigService;
  let transactionSender: string;
  let transactionReceiver: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TransferModule, ApiConfigModule],
    }).compile();

    transferService = moduleRef.get<TransferService>(TransferService);
    apiConfigService = moduleRef.get<ApiConfigService>(ApiConfigService);

    const transactionFilter = new TransactionFilter();

    const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 1 }, new TransactionQueryOptions());
    expect(transfers).toHaveLength(1);

    transactionSender = 'erd18kmncel8a32yd94ktzlqag9etdrpdnyph8wus2nqyd4lp865gncq40znww';
    transactionReceiver = 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets';

  }, Constants.oneHour() * 1000);

  describe('Transfers list', () => {
    describe('Transfers pagination', () => {
      it(`should return a list with 25 transfers`, async () => {
        const transfers = await transferService.getTransfers(new TransactionFilter(), { from: 0, size: 25 }, new TransactionQueryOptions());

        expect(transfers).toHaveLength(25);
      });

      it(`should return a list with 100 transfers`, async () => {
        const transfers = await transferService.getTransfers(new TransactionFilter(), { from: 0, size: 100 }, new TransactionQueryOptions());

        expect(transfers).toHaveLength(100);
      });
    });

    describe('Transfers filters', () => {
      it.skip(`should return a list of transfers between two accounts (first address is always sender and seconds address is always receiver)`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = transactionSender;
        transactionFilter.receivers = [transactionReceiver];

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.sender).toBe(transactionSender);
          expect(transfer.receiver).toBe(transactionReceiver);
        }
      });

      //TBD
      it.skip(`should return a list of transfers between two accounts`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.address = transactionSender;
        transactionFilter.senderOrReceiver = transactionReceiver;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect([transactionSender, transactionReceiver].includes(transfer.sender)).toBe(true);
          expect([transactionSender, transactionReceiver].includes(transfer.receiver)).toBe(true);
        }
      });

      it(`should return a list with pending transfers`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.status = TransactionStatus.pending;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.status).toBe(TransactionStatus.pending);
        }
      });

      it(`should return a list with transfers in one date range`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559162;
        transactionFilter.after = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transfer.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return a list with transfers after one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
        }
      });

      it(`should return a list with transfers before one date`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.before = 1625559108;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.timestamp).toBeLessThanOrEqual(transactionFilter.before);
        }
      });

      it(`should return transfers for an address`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.address = address;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers).toBeInstanceOf(Array);
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.sender === address || transfer.receiver === address).toStrictEqual(true);
        }
      });

      it.skip(`should return self transfers for an address`, async () => {
        const address = transactionSender;
        const transactionFilter = new TransactionFilter();
        transactionFilter.sender = address;
        transactionFilter.receivers = [address];

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers).toBeInstanceOf(Array);

        for (const transfer of transfers) {
          expect(transfer.sender === address && transfer.receiver === address).toStrictEqual(true);
        }
      });

      it(`should return a list with transfers where an address is sender, in one date range, with success status`, async () => {
        const address: string = "erd1qqqqqqqqqqqqqpgq50dge6rrpcra4tp9hl57jl0893a4r2r72jpsk39rjj";
        const transactionFilter = new TransactionFilter();
        transactionFilter.after = 1625559108;
        transactionFilter.senders = [address];
        transactionFilter.status = TransactionStatus.success;

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers.length).toBeGreaterThan(0);

        for (const transfer of transfers) {
          expect(transfer.sender).toBe(address);
          expect(transfer.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
          expect(transfer.status).toBe(TransactionStatus.success);
        }
      });

      it('should return a list with transfers that call ESDTNFTTransfer function', async () => {
        if (apiConfigService.getIsIndexerV3FlagActive()) {
          const transactionFilter = new TransactionFilter();
          transactionFilter.function = 'ESDTNFTTransfer';

          const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
          for (const transfer of transfers) {
            expect(BinaryUtils.base64Decode(transfer.data ?? '').startsWith("\nESDTNFTTransfer@")).toStrictEqual(true);
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

        const transfers = await transferService.getTransfers(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
        expect(transfers).toHaveLength(2);
        const transactionsHashes = transfers.map(({ txHash }) => txHash);
        expect(transactionsHashes.includes('8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182'));
        expect(transactionsHashes.includes('56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777'));
        expect(!transactionsHashes.includes('INVALIDTXHASH'));
      });

      it(`should return transfers with function "claim_rewards"`, async () => {
        const transactionFilter = new TransactionFilter();
        transactionFilter.function = "claim_rewards";

        const transfers = await transferService.getTransfers(transactionFilter, new QueryPagination(), new TransactionQueryOptions());
        expect(transfers).toHaveLength(25);

        for (const tranfer of transfers) {
          expect(tranfer.function).toStrictEqual('claim_rewards');
        }
      });
    });
  });

  describe('Transfers count', () => {
    it(`should return transfers count based on token indentifier`, async () => {
      jest.spyOn(ElasticService.prototype, 'getCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_collection: string, _elasticQuery: ElasticQuery | undefined) => 10100));

      const transactionFilter = new TransactionFilter();
      transactionFilter.token = transactionDetails.tokenIdentifier;

      const count = await transferService.getTransfersCount(transactionFilter);
      expect(count).toStrictEqual(10100);
    });
  });
});
