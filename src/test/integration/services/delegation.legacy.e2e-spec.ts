import { Test } from "@nestjs/testing";
import { AccountModule } from "src/endpoints/accounts/account.module";
import { DelegationLegacyModule } from "src/endpoints/delegation.legacy/delegation.legacy.module";
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/jest.extensions';
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { AccountService } from "src/endpoints/accounts/account.service";
import { DelegationLegacy } from "src/endpoints/delegation.legacy/entities/delegation.legacy";
import { AccountDelegationLegacy } from "src/endpoints/delegation.legacy/entities/account.delegation.legacy";
import { AccountFilter } from "src/endpoints/accounts/entities/account.filter";

describe('Delegation Legacy Service', () => {
  let delegationLegacyService: DelegationLegacyService;
  let accountService: AccountService;
  let accountAddress: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountModule, DelegationLegacyModule],
    }).compile();

    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
    accountService = moduleRef.get<AccountService>(AccountService);

    const accounts = await accountService.getAccounts({ from: 0, size: 1 }, new AccountFilter());
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;
  });

  describe('Get Delegation', () => {
    it('should return delegation legacy', async () => {
      const delegation = await delegationLegacyService.getDelegation();
      expect(delegation).toHaveStructure(Object.keys(new DelegationLegacy()));
    });
  });

  describe('Get Delegation For Address', () => {
    it('should return delegation details for a specific address', async () => {
      const delegationAddress = await delegationLegacyService.getDelegationForAddress(accountAddress);
      expect(delegationAddress).toHaveStructure(Object.keys(new AccountDelegationLegacy()));
    });
  });
});
