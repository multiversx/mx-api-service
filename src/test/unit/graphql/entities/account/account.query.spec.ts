import { Test } from "@nestjs/testing";

import { randomInt } from "crypto";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountQuery } from "src/graphql/entities/account/account.query";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountServiceMock } from "src/test/unit/graphql/mocks/account.service.mock";
import { GetAccountsInput } from "src/graphql/entities/account/account.input";

describe(AccountQuery, () => {

  const AccountServiceMockProvider = {
    provide: AccountService,
    useClass: AccountServiceMock,
  };

  let accountQuery: AccountQuery;

  let accountServiceMock: AccountService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccountQuery,

        AccountServiceMockProvider,
      ],
    }).compile();

    accountQuery = module.get<AccountQuery>(AccountQuery);

    accountServiceMock = module.get<AccountService>(AccountService);
  });

  it("get accounts with default input should return accounts", async () => {
    const input: GetAccountsInput = new GetAccountsInput();

    const expectedAccounts: Account[] = AccountServiceMock.accounts;

    await assertGetAccounts(input, expectedAccounts);
  });

  it("get accounts with user input should return accounts", async () => {
    const input: GetAccountsInput = new GetAccountsInput({
      from: randomInt(3),
      size: randomInt(3),
    });

    const expectedAccounts: Account[] = AccountServiceMock.accounts.slice(input.from, input.size);

    await assertGetAccounts(input, expectedAccounts);
  });

  it("get accounts count should return accounts count", async () => {
    jest.spyOn(accountServiceMock, "getAccountsCount");

    const actualAccountsCount: number = await accountQuery.getAccountsCount();
    const expectedAccountsCount: number = AccountServiceMock.accounts.length;

    expect(actualAccountsCount).toEqual(expectedAccountsCount);

    expect(accountServiceMock.getAccountsCount).toHaveBeenCalledTimes(1);
  });

  async function assertGetAccounts(input: GetAccountsInput, expectedAccounts: Account[]) {
    jest.spyOn(accountServiceMock, "getAccounts");

    const actualAccounts: Account[] = await accountQuery.getAccounts(input);

    expect(actualAccounts).toEqual(expectedAccounts);

    expect(accountServiceMock.getAccounts).toHaveBeenCalledWith({ from: input.from, size: input.size });
  }
});
