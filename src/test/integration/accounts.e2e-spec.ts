import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { DelegationLegacyService } from 'src/endpoints/delegation.legacy/delegation.legacy.service';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';

describe('Account Service', () => {
  let accountService: AccountService;
  let delegationLegacyService: DelegationLegacyService;
  const accountAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85';

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    accountService = moduleRef.get<AccountService>(AccountService);
    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
  }, Constants.oneHour() * 1000);

  describe('Accounts list', () => {
    it('accounts should have address, shard and nonce', async () => {
      const accountsList = await accountService.getAccounts({ from: 0, size: 25 });
      for (const account of accountsList) {
        expect(account).toHaveProperty('address');
        expect(account).toHaveProperty('shard');
        expect(account).toHaveProperty('nonce');
      }
    });

    it(`should return a list with 25 accounts`, async () => {
      const accountsList = await accountService.getAccounts({ from: 0, size: 25 });

      expect(accountsList).toBeInstanceOf(Array);
      expect(accountsList).toHaveLength(25);

      for (const account of accountsList) {
        expect(account).toHaveStructure(Object.keys(new Account()));
      }
    });

    it(`should return a list with 50 accounts`, async () => {
      const accountsList = await accountService.getAccounts({ from: 0, size: 50 });
      expect(accountsList).toBeInstanceOf(Array);
      expect(accountsList).toHaveLength(50);

      for (const account of accountsList) {
        expect(account).toHaveStructure(Object.keys(new Account()));
      }
    });
  });

  describe('Accounts count', () => {
    it(`should return a number`, async () => {
      const accountsCount = await accountService.getAccountsCount();
      expect(typeof accountsCount).toBe('number');
    });
  });

  describe('Specific account', () => {
    describe('Account Details', () => {
      it(`should return a detailed account with account address`, async () => {
        const accountDetailed = await accountService.getAccount(accountAddress);
        expect(accountDetailed).toBeDefined();
        expect(accountDetailed?.address).toStrictEqual(accountAddress);
      });

      it(`should throw 'Account not found' error`, async () => {
        expect(await accountService.getAccount(accountAddress + 'a')).toBeNull();
      });

    });

    describe('Account Delegation Legacy', () => {
      it(`should return a delegation legacy for an account with address`, async () => {
        const accountDelegationLegacy = await delegationLegacyService.getDelegationForAddress(accountAddress);
        expect(accountDelegationLegacy).toHaveStructure(Object.keys(new AccountDelegationLegacy()));
      });
    });

    describe('Account userName based on Address', () => {
      it('should return account username based on address ', async () => {
        const accountUsername = await accountService.getAccountUsername(accountAddress);
        expect(accountUsername).toBeDefined();
      });
    });

    describe('Account Deployed', () => {
      it(`should return the number of account deployed for address`, async () => {
        const accountDeployed = await accountService.getAccountDeployedAt(accountAddress);
        expect(typeof accountDeployed).toBe('number');
      });
    });

    describe('Get Accounts Raw', () => {
      it(`should return the number of account deployed for address with size 10`, async () => {
        const accountRaw = await accountService.getAccountsRaw({ from: 0, size: 10 });
        expect(accountRaw).toBeInstanceOf(Array);
        expect(accountRaw).toHaveLength(10);

        for (const account of accountRaw) {
          expect(account).toBeInstanceOf(Account);
        }
      });

      it(`should return the number of account deployed for address with size 50`, async () => {
        const accountRaw = await accountService.getAccountsRaw({ from: 0, size: 50 });
        expect(accountRaw).toBeInstanceOf(Array);
        expect(accountRaw).toHaveLength(50);

        for (const account of accountRaw) {
          expect(account).toBeInstanceOf(Account);
        }
      });
    });

    describe('Deferred Account', () => {
      it(`should return a list of deferred accounts`, async () => {
        const defferedAccount = await accountService.getDeferredAccount(accountAddress);
        expect(defferedAccount).toBeInstanceOf(Array);
      });
    });

    describe('Get Keys', () => {
      it(`should return a list of keys for a specific address`, async () => {
        const getKeysAddress = await accountService.getDeferredAccount(accountAddress);
        expect(getKeysAddress).toBeInstanceOf(Array);
      });
    });
  });

  describe('Get Account Contracts', () => {
    it(`should return accounts contracts`, async () => {
      const accountRaw = await accountService.getAccountContracts({ from: 0, size: 10 }, accountAddress);

      for (const account of accountRaw) {
        expect(account).toBeInstanceOf(Array);
      }
    });
    it(`should return accounts contracts with size 50`, async () => {
      const accountRaw = await accountService.getAccountContracts({ from: 0, size: 10 }, accountAddress);

      for (const account of accountRaw) {
        expect(account).toBeInstanceOf(Array);
        expect(account).toHaveLength(50);
      }
    });

    it(`should return accounts contracts with properties`, async () => {
      const accountRaw = await accountService.getAccountContracts({ from: 0, size: 10 }, accountAddress);

      for (const account of accountRaw) {
        expect(account).toHaveProperty('address');
        expect(account).toHaveProperty('shard');
        expect(account).toHaveProperty('nonce');
      }
    });
  });

  describe('Account Contract Count', () => {
    it(`should return the number of accounts deployed for address`, async () => {
      const accountCount = await accountService.getAccountContractsCount(accountAddress);
      expect(typeof accountCount).toBe('number');
    });
  });

  describe('Account Username Raw', () => {
    it(`should return the username raw`, async () => {
      const accountUsername = await accountService.getAccountUsernameRaw(accountAddress);
      expect(typeof accountUsername).toBe('string');
    });
  });

  describe('Get Keys', () => {
    it(`should return keys for a specific address`, async () => {
      const returnKeys = await accountService.getKeys(accountAddress);
      expect(returnKeys).toBeInstanceOf(Array);
      expect(returnKeys).toBeDefined();
    });
  });
});

