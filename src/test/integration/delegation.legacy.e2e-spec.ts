import Initializer from "./e2e-init";
import { Test } from "@nestjs/testing";
import { PublicAppModule } from "../../public.app.module";
import { Constants } from "../../utils/constants";
import { DelegationLegacyService } from "../../endpoints/delegation.legacy/delegation.legacy.service";
import { AccountService } from "../../endpoints/accounts/account.service";

describe('Delegation Legacy Service', () => {
  let delegationLegacyService: DelegationLegacyService;
  let accountService: AccountService;
  let accountAddress: string;


  beforeAll(async () => {
    await Initializer.initialize();
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
    accountService = moduleRef.get<AccountService>(AccountService);

    const accounts = await accountService.getAccounts({ from: 0, size: 1 });
    expect(accounts).toHaveLength(1);

    const account = accounts[0];
    accountAddress = account.address;

  }, Constants.oneHour() * 1000);

  describe('Get Delegation', () => {
    it('should return a list of delegations', async () => {
      const delegationResult = await delegationLegacyService.getDelegation();
      expect(delegationResult).toBeInstanceOf(Object);
    });
    it('delegation should have properties of DelegationLegacy', async () => {
      const delegationResult = await delegationLegacyService.getDelegation();
      expect(delegationResult).toBeDefined();
      expect(delegationResult).toHaveProperty('totalWithdrawOnlyStake');
      expect(delegationResult).toHaveProperty('totalWaitingStake');
      expect(delegationResult).toHaveProperty('totalActiveStake');
      expect(delegationResult).toHaveProperty('totalUnstakedStake');
      expect(delegationResult).toHaveProperty('totalDeferredPaymentStake');
      expect(delegationResult).toHaveProperty('numUsers');
    });
  });

  describe('Get Delegation For Address', () => {
    it('should return delegation details for a specific address', async () => {
      const delegationAddressResult = await delegationLegacyService.getDelegationForAddress(accountAddress);
      expect(delegationAddressResult).toBeInstanceOf(Object);
      expect(delegationAddressResult).toBeDefined();
    });
  });
});
