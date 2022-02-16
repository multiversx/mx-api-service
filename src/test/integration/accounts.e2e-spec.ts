import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { DelegationLegacyService } from 'src/endpoints/delegation.legacy/delegation.legacy.service';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { DeployedContract } from 'src/endpoints/accounts/entities/deployed.contract';
import userAccount from "../data/accounts/user.account";
import providerAccount from "../data/accounts/provider.account";
import { AccountKey } from 'src/endpoints/accounts/entities/account.key';
import {TokenService} from "../../endpoints/tokens/token.service";

describe('Account Service', () => {
  let accountService: AccountService;
  let delegationLegacyService: DelegationLegacyService;
  let tokensService: TokenService;
  const smartContractOwnerAddress: string = 'erd1ss6u80ruas2phpmr82r42xnkd6rxy40g9jl69frppl4qez9w2jpsqj8x97';

  beforeAll(async () => {
    await Initializer.initialize();

    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    accountService = moduleRef.get<AccountService>(AccountService);
    delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);
    tokensService = moduleRef.get<TokenService>(TokenService);
  }, Constants.oneHour() * 1000);

  describe('Accounts list', () => {
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
        const accountDetailed = await accountService.getAccount(userAccount.address);
        if (!accountDetailed) {
          throw new Error('Account must be defined');
        }

        expect(accountDetailed.address).toStrictEqual(userAccount.address);
        expect(accountDetailed.developerReward).toStrictEqual(userAccount.developerReward);
        expect(accountDetailed.rootHash).toStrictEqual(userAccount.rootHash);
        expect(accountDetailed.username).toStrictEqual(userAccount.username);
        expect(accountDetailed.shard).toStrictEqual(userAccount.shard);

        expect(accountDetailed.nonce).toBeGreaterThanOrEqual(userAccount.nonce);
        expect(accountDetailed.txCount).toBeGreaterThanOrEqual(userAccount.txCount);

        expect(accountDetailed.balance).toBeDefined();
        expect(Number(accountDetailed.balance)).toBeGreaterThan(0);
      });

      it(`should throw 'Account not found' error`, async () => {
        expect(await accountService.getAccount(userAccount.address + 'a')).toBeNull();
      });

    });

    describe('Deferred Account', () => {
      it(`should return a list of deferred accounts`, async () => {
        const account = await accountService.getDeferredAccount(userAccount.address);
        expect(account).toBeInstanceOf(Array);
      });
    });

    describe('Account Delegation Legacy', () => {
      it(`should return a delegation legacy for an account with address`, async () => {
        const account = await delegationLegacyService.getDelegationForAddress(userAccount.address);
        expect(account).toHaveStructure(Object.keys(new AccountDelegationLegacy()));
      });
    });

    describe('Account username based on Address', () => {
      it('should return account username based on address ', async () => {
        const username = await accountService.getAccountUsername(userAccount.address);
        expect(username).toBe(userAccount.username);
      });
    });

    describe('Account Deployed', () => {
      it(`should return the deployed timestamp for a given address`, async () => {
        const accountDeployed = await accountService.getAccountDeployedAt(providerAccount.address);
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

    describe('Get Keys', () => {
      it(`should return a list of keys for a specific address`, async () => {
        const keys = await accountService.getKeys(providerAccount.address);
        expect(keys).toBeInstanceOf(Array);

        for (const key of keys) {
          expect(key).toHaveStructure(Object.keys(new AccountKey()));
        }
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
      const username = await accountService.getAccountUsernameRaw(userAccount.address);
      expect(username).toEqual(userAccount.username);
    });
  });

  describe('Get Account Deployed Raw', () => {
    it(`should return keys for a specific address`, async () => {
      const account = await accountService.getAccountDeployedAtRaw(providerAccount.address);
      expect(typeof account).toBe('number');
    });

    it(`should return null if account is not deployed`, async () => {
      const account = await accountService.getAccountDeployedAtRaw(userAccount.address);
      expect(account).toBeNull();
    });
  });

  describe('Account history & Account Token History', () => {
    describe('Account History', () => {

      it(`should return the account EGLD balance history`, async () => {
        const accountHistories = await accountService.getAccountHistory(smartContractOwnerAddress, {from: 0, size: 1});
        expect(accountHistories).toBeDefined();
        for (const account of accountHistories) {
          expect(account).toHaveProperty('address');
          expect(account).toHaveProperty('balance');
          expect(account).toHaveProperty('timestamp');
        }
      });
    });

    describe('Account Token balance history', () => {
      it('should return the token EGLD balance history ', async () => {
        const accountTokens = await tokensService.getTokensForAddress(smartContractOwnerAddress, {from: 0, size: 1}, {});
        if(accountTokens.length){
          const accountTokenHistories = await accountService.getAccountTokenHistory(smartContractOwnerAddress,
              accountTokens[0].identifier, {from: 0, size: 1});

          for (const account of accountTokenHistories) {
            expect(account).toHaveProperty('address');
            expect(account).toHaveProperty('balance');
            expect(account).toHaveProperty('timestamp');
            expect(account).toHaveProperty('token');
          }
        }
      });
    });
  });
});
