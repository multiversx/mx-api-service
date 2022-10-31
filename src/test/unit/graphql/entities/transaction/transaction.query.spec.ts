import { Test } from "@nestjs/testing";

import { GetTransactionsCountInput } from "src/graphql/entities/transaction/transaction.input";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionServiceMock } from "src/test/unit/graphql/mocks/transaction.service.mock";
import { TransactionQuery } from "src/graphql/entities/transaction/transaction.query";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";

describe(TransactionQuery, () => {

  const TransactionServiceMockProvider = {
    provide: TransactionService,
    useClass: TransactionServiceMock,
  };

  let transactionQuery: TransactionQuery;

  let transactionServiceMock: TransactionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionQuery,

        TransactionServiceMockProvider,
      ],
    }).compile();

    transactionQuery = module.get<TransactionQuery>(TransactionQuery);

    transactionServiceMock = module.get<TransactionService>(TransactionService);
  });

  it("should be defined", () => {
    expect(transactionQuery).toBeDefined();
  });

  it("get transactions count with non-existing transactions should return count", async () => {
    const input: GetTransactionsCountInput = new GetTransactionsCountInput();

    const expectedTransactionsCount: number = TransactionServiceMock.transactions.length;

    await assertGetTransactionsCount(input, expectedTransactionsCount);
  });

  it("get transactions count with existing transactions should return one", async () => {
    // @ts-ignore
    const expectedTransactions: TransactionDetailed[] = TransactionServiceMock.transactions.slice(0, 3);

    const input: GetTransactionsCountInput = new GetTransactionsCountInput({
      hashes: expectedTransactions.map((transaction) => transaction.txHash),
    });

    const expectedTransactionsCount: number = expectedTransactions.length;

    await assertGetTransactionsCount(input, expectedTransactionsCount);
  });

  async function assertGetTransactionsCount(input: GetTransactionsCountInput, expectedTransactionsCount: number) {
    jest.spyOn(transactionServiceMock, "getTransactionCount");

    const actualTransactionsCount: number = await transactionQuery.getTransactionsCount(input);

    expect(actualTransactionsCount).toEqual(expectedTransactionsCount);

    expect(transactionServiceMock.getTransactionCount).toHaveBeenCalledWith(
      new TransactionFilter({
        sender: input.sender,
        receivers: input.receiver ? [input.receiver] : [],
        token: input.token,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        search: input.search,
        function: input.function,
        before: input.before,
        after: input.after,
        condition: input.condition,
      })
    );
  }
});
