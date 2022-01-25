import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { DelegationLegacyService } from 'src/endpoints/delegation.legacy/delegation.legacy.service';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';

describe('Account Service', () => {
  let accountService: AccountService;
  let delegationLegacyService: DelegationLegacyService;
  const accountAddress: string = 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz';
  const providerAddress: string = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqq8hlllls7a6h85';
  const smartContractAddress: string = 'erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3';
  const smartContractOwnerAddress: string = 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97';

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

    describe('Account username based on Address', () => {
      it('should return account username based on address ', async () => {
        const accountUsername = await accountService.getAccountUsername(accountAddress);
        expect(accountUsername).toBe('alice.elrond');
      });
    });

    describe('Account Deployed', () => {
      it(`should return the deployed timestamp for a given address`, async () => {
        const accountDeployed = await accountService.getAccountDeployedAt(smartContractAddress);
        expect(typeof accountDeployed).toBe('number');
      });
    });

    describe('Get Accounts Raw', () => {
      it(`should return 10 accounts`, async () => {
        const accountsRaw = await accountService.getAccountsRaw({ from: 0, size: 10 });
        expect(accountsRaw).toBeInstanceOf(Array);
        expect(accountsRaw).toHaveLength(10);

        for (const account of accountsRaw) {
          expect(account).toHaveStructure(Object.keys(new Account()));
        }
      });

      it(`should return 50 accounts`, async () => {
        const accountsRaw = await accountService.getAccountsRaw({ from: 0, size: 50 });
        expect(accountsRaw).toBeInstanceOf(Array);
        expect(accountsRaw).toHaveLength(50);

        for (const account of accountsRaw) {
          expect(account).toHaveStructure(Object.keys(new Account()));
        }
      });
    });

    describe('Deferred Account', () => {
      it(`should return a list of deferred accounts`, async () => {
        const account = await accountService.getDeferredAccount(accountAddress);
        expect(account).toBeInstanceOf(Array);
      });
    });

    describe('Get Keys', () => {
      it(`should return a list of keys for a specific address`, async () => {
        const keys = await accountService.getKeys(providerAddress);
        expect(keys).toBeInstanceOf(Array);
      });
    });
  });

  describe('Get Account Contracts', () => {
    it(`should return account contracts`, async () => {
      const contracts = await accountService.getAccountContracts({ from: 0, size: 10 }, smartContractOwnerAddress);
      expect(contracts).toBeInstanceOf(Array);
      expect(contracts).toHaveLength(10);

      for (const contract of contracts) {
        expect(contract).toHaveStructure(Object.keys(new DeployedContract()));
      }
    });

    it(`should return accounts contracts with size 50`, async () => {
      const contracts = await accountService.getAccountContracts({ from: 0, size: 50 }, smartContractOwnerAddress);
      expect(contracts).toBeInstanceOf(Array);
      expect(contracts.length).toBeGreaterThanOrEqual(12);

      for (const contract of contracts) {
        expect(contract).toHaveStructure(Object.keys(new DeployedContract()));
      }
    });
  });

  describe('Account Contract Count', () => {
    it(`should return the number of contracts deployed by account`, async () => {
      const count = await accountService.getAccountContractsCount(smartContractOwnerAddress);
      expect(count).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Account Username Raw', () => {
    it(`should return the username raw`, async () => {
      const username = await accountService.getAccountUsernameRaw(accountAddress);
      expect(username).toBe('alice.elrond');
    });
  });

  describe('Get Keys', () => {
    it(`should return keys for a specific address`, async () => {
      const keys = await accountService.getKeys(providerAddress);
      expect(keys).toBeInstanceOf(Array);
    });
  });
});

