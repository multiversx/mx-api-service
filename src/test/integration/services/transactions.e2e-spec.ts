import { Test } from '@nestjs/testing';
import { TransactionService } from 'src/endpoints/transactions/transaction.service';
import { PublicAppModule } from 'src/public.app.module';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import { TransactionUtils } from 'src/endpoints/transactions/transaction.utils';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/jest.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/array.extensions';
import { TransactionQueryOptions } from 'src/endpoints/transactions/entities/transactions.query.options';
import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';
import { TransactionOptionalFieldOption } from 'src/endpoints/transactions/entities/transaction.optional.field.options';

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

  describe('getTransaction', () => {
    it('should return transaction details', async () => {
      const txHash: string = "4302d0af550e47a21e5d183f0918af7dbc015f1e7dea6d2ab2025ee675bf8517";
      const result = await transactionService.getTransaction(txHash);

      expect(result).toHaveStructure(Object.keys(new TransactionDetailed()));
    });

    it('should return operations attribute for a given transaction', async () => {
      const txHash: string = "4302d0af550e47a21e5d183f0918af7dbc015f1e7dea6d2ab2025ee675bf8517";
      const result = await transactionService.getTransaction(txHash, [TransactionOptionalFieldOption.operations]);

      expect(result?.operations).toBeDefined();
      expect(result?.operations[0].id).toStrictEqual(txHash);
      expect(result?.operations[0].action).toStrictEqual("transfer");
    });

    it('should return logs attribute for a given transaction', async () => {
      const txHash: string = "4302d0af550e47a21e5d183f0918af7dbc015f1e7dea6d2ab2025ee675bf8517";
      const results = await transactionService.getTransaction(txHash, [TransactionOptionalFieldOption.logs]);

      if (!results) {
        throw new Error("Properties are not defined");
      }

      expect(results.logs).toEqual(expect.objectContaining({
        id: '4302d0af550e47a21e5d183f0918af7dbc015f1e7dea6d2ab2025ee675bf8517',
        address: 'erd1qqqqqqqqqqqqqpgqmuk0q2saj0mgutxm4teywre6dl8wqf58xamqdrukln',
        events: expect.arrayContaining([
          expect.objectContaining({
            identifier: 'ESDTTransfer',
            address: 'erd10pccteep4cvw3vcjgrrfdn774qm8znvvxy7dpm75z8l0hrsauulqx082y9',
          }),
        ]),
      }));
    });
  });

  it(`should return a list of transfers between two accounts (first address is always sender and seconds adress is always receiver)`, async () => {
    const sender = 'erd18kmncel8a32yd94ktzlqag9etdrpdnyph8wus2nqyd4lp865gncq40znww';
    const receiver = 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets';
    const transactionFilter = new TransactionFilter();
    transactionFilter.sender = sender;
    transactionFilter.receivers = [receiver];

    const transfers = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
    expect(transfers.length).toBeGreaterThan(0);

    for (const transfer of transfers) {
      expect(transfer.sender).toBe(sender);
      expect([sender, receiver].includes(transfer.receiver)).toBe(true); //it can be an ESDNFTTransfer which is a self transaction
    }
  });

  //TBD
  it.skip(`should return a list of transfers between two accounts`, async () => {
    const sender = 'erd18kmncel8a32yd94ktzlqag9etdrpdnyph8wus2nqyd4lp865gncq40znww';
    const receiver = 'erd1sdslvlxvfnnflzj42l8czrcngq3xjjzkjp3rgul4ttk6hntr4qdsv6sets';
    const transactionFilter = new TransactionFilter();
    transactionFilter.address = sender;
    transactionFilter.senderOrReceiver = receiver;

    const transfers = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 }, new TransactionQueryOptions());
    expect(transfers.length).toBeGreaterThan(0);

    for (const transfer of transfers) {
      expect([sender, receiver].includes(transfer.sender)).toBe(true);
      expect([sender, receiver].includes(transfer.receiver)).toBe(true);
    }
  });
});
