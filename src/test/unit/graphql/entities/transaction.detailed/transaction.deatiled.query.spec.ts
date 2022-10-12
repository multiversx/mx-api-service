import { Test } from "@nestjs/testing";

import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionDetailedQuery } from "src/graphql/entities/transaction.detailed/transaction.detailed.query";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransactionServiceMock } from "src/test/unit/graphql/mocks/transaction.service.mock";
import { GetTransactionDetailedInput } from "src/graphql/entities/transaction.detailed/transaction.detailed.input";

describe(TransactionDetailedQuery, () => {

  const TransactionServiceMockProvider = {
    provide: TransactionService,
    useClass: TransactionServiceMock,
  };

  let transactionDetailedQuery: TransactionDetailedQuery;

  let transactionServiceMock: TransactionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionDetailedQuery,

        TransactionServiceMockProvider,
      ],
    }).compile();

    transactionDetailedQuery = module.get<TransactionDetailedQuery>(TransactionDetailedQuery);

    transactionServiceMock = module.get<TransactionService>(TransactionService);
  });

  it("should be defined", () => {
    expect(transactionDetailedQuery).toBeDefined();
  });

  it("get transaction with non-existing hash should return null", async () => {
    const expectedTransaction = null;

    await assertGetTransactionDetailed("", expectedTransaction);
  });

  it("get transaction with existing hash should return transaction", async () => {
    // @ts-ignore
    const expectedTransaction: Transaction = TransactionServiceMock.transactions.at(0);

    await assertGetTransactionDetailed(expectedTransaction.txHash, expectedTransaction);
  });

  async function assertGetTransactionDetailed(hash: string, expectedTransaction: Transaction | null) {
    jest.spyOn(transactionServiceMock, "getTransaction");
    
    const input: GetTransactionDetailedInput = new GetTransactionDetailedInput({
      hash: hash,
    });

    const actualTransaction = await transactionDetailedQuery.getTransactionDetailed(input);

    expect(actualTransaction).toEqual(expectedTransaction);

    expect(transactionServiceMock.getTransaction).toHaveBeenCalledWith(input.hash);
  }
});
