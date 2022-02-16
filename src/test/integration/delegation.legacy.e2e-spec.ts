import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { DelegationLegacyService } from "../../endpoints/delegation.legacy/delegation.legacy.service";
import { AccountService } from "../../endpoints/accounts/account.service";
import { DelegationLegacy } from "../../endpoints/delegation.legacy/entities/delegation.legacy";
import { AccountDelegationLegacy } from "../../endpoints/delegation.legacy/entities/account.delegation.legacy";

describe('Delegation Legacy Service', () => {
  let delegationLegacyService: DelegationLegacyService;
  let accountService: AccountService;
  let accountAddress: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
    accountService = moduleRef.get<AccountService>(AccountService);

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
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
