import { Test } from "@nestjs/testing";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountDetailedQuery } from "src/graphql/entities/account.detailed/account.detailed.query";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountServiceMock } from "src/test/unit/graphql/mocks/account.service.mock";
import { GetAccountDetailedInput } from "src/graphql/entities/account.detailed/account.detailed.input";

describe(AccountDetailedQuery, () => {

  const AccountServiceMockProvider = {
    provide: AccountService,
    useClass: AccountServiceMock,
  };

  let accountDetailedQuery: AccountDetailedQuery;

  let accountServiceMock: AccountService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AccountDetailedQuery,

        AccountServiceMockProvider,
      ],
    }).compile();

    accountDetailedQuery = module.get<AccountDetailedQuery>(AccountDetailedQuery);

    accountServiceMock = module.get<AccountService>(AccountService);
  });

  it("should be defined", () => {
    expect(accountDetailedQuery).toBeDefined();
  });

  // it("get account with non-existing address should return null", async () => {
  //   const expectedAccount = null;

  //   await assertGetAccountDetailed("", expectedAccount);
  // });

  it("get account with existing address should return account", async () => {
    // @ts-ignore
    const expectedAccount: Account = AccountServiceMock.accounts.at(0);

    await assertGetAccountDetailed(expectedAccount.address, expectedAccount);
  });

  async function assertGetAccountDetailed(address: string, expectedAccount: Account | null) {
    jest.spyOn(accountServiceMock, "getAccountSimple");

    const input: GetAccountDetailedInput = new GetAccountDetailedInput({
      address: address,
    });

    const actualAccount = await accountDetailedQuery.getAccountDetailed(input);

    expect(actualAccount).toEqual(expectedAccount);

    expect(accountServiceMock.getAccountSimple).toHaveBeenCalledWith(input.address);
  }
});
