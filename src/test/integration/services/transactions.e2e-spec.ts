import { Test } from '@nestjs/testing';
import { TransactionService } from 'src/endpoints/transactions/transaction.service';
import { PublicAppModule } from 'src/public.app.module';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import { TransactionUtils } from 'src/endpoints/transactions/transaction.utils';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/jest.extensions';
import '@elrondnetwork/erdnest/lib/src/utils/extensions/array.extensions';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';

describe('Transaction Service', () => {
  let transactionService: TransactionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    transactionService = moduleRef.get<TransactionService>(TransactionService);

  });
  beforeEach(() => { jest.restoreAllMocks(); });

  describe('getTransactionCountForAddress', () => {
    it('should return total transactions count for a specific address', async () => {
      jest
        .spyOn(IndexerService.prototype, 'getTransactionCountForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => 41));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const results = await transactionService.getTransactionCountForAddress(address);

      expect(results).toStrictEqual(41);
    });
  });

  describe('getTransactionCount', () => {
    it('should return total transactions count with transactions filter applied', async () => {
      jest
        .spyOn(IndexerService.prototype, 'getTransactionCount')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_filter: TransactionFilter, _address?: string) => 41));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const filter = new TransactionFilter();
      filter.sender = address;

      const results = await transactionService.getTransactionCount(filter);
      expect(results).toStrictEqual(41);
    });

    it('should return total transactions count with transactions filter applied and address', async () => {
      const mock = jest.spyOn(TransactionUtils, 'isTransactionCountQueryWithAddressOnly');
      mock.mockImplementation((_filter: TransactionFilter, _address?: string) => true);

      jest
        .spyOn(TransactionService.prototype, 'getTransactionCountForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => 32));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const filter = new TransactionFilter();
      filter.token = "MEX-455c57";

      const results = await transactionService.getTransactionCount(filter, address);
      expect(results).toStrictEqual(32);
    });

    it('should return total transactions count with transactions filter applied and sender/receiver', async () => {
      const mock = jest.spyOn(TransactionUtils, 'isTransactionCountQueryWithSenderAndReceiver');
      mock.mockImplementation((_filter: TransactionFilter) => true);

      jest
        .spyOn(TransactionService.prototype, 'getTransactionCountForAddress')
        // eslint-disable-next-line require-await
        .mockImplementation(jest.fn(async (_address: string) => 24));

      const address: string = "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz";
      const filter = new TransactionFilter();
      filter.receivers = ["erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"];

      const results = await transactionService.getTransactionCount(filter, address);
      expect(results).toStrictEqual(24);
    });
  });

  describe('getTransactions', () => {
    it('should return 5 transactions', async () => {
      const results = await transactionService.getTransactions(
        new TransactionFilter(),
        new QueryPagination({ size: 5 }));

      for (const result of results) {
        expect(result).toHaveStructure(Object.keys(new Transaction()));
      }
      expect(results).toHaveLength(5);
    });
  });

  it('should return 2 transactions with hashes filter applied', async () => {
    const txFilters = new TransactionFilter();
    txFilters.hashes = [
      "29a2bed2543197e69c9bf16b30c4b0196f5e7a59584aba2e1a2127bf06cdfd2d",
      "0cbaeb61cd2d901e7363b83e35750d0cbf2045ed853ef8f7af7cefdef622671e"];

    const queryOptions = new TransactionQueryOptions();
    queryOptions.withScResults = true;

    const results = await transactionService.getTransactions(
      txFilters,
      new QueryPagination({ size: 2 }));

    for (const result of results) {
      expect(result).toHaveStructure(Object.keys(new Transaction()));
    }
  });

  it('should return 2 transactions with hashes filter applied and withScResults', async () => {
    const txFilters = new TransactionFilter();
    txFilters.hashes = [
      "29a2bed2543197e69c9bf16b30c4b0196f5e7a59584aba2e1a2127bf06cdfd2d",
      "0cbaeb61cd2d901e7363b83e35750d0cbf2045ed853ef8f7af7cefdef622671e"];

    const queryOptions = new TransactionQueryOptions();
    queryOptions.withScResults = true;

    const results = await transactionService.getTransactions(
      txFilters,
      new QueryPagination({ size: 2 }),
      queryOptions);

    const txResults = results.map((result) => result.txHash);

    expect(results).toHaveLength(2);
    expect(txResults.includes("29a2bed2543197e69c9bf16b30c4b0196f5e7a59584aba2e1a2127bf06cdfd2d")).toBeTruthy();
    expect(txResults.includes("0cbaeb61cd2d901e7363b83e35750d0cbf2045ed853ef8f7af7cefdef622671e")).toBeTruthy();
  });
});
