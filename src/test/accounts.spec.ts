import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';
import { AccountService } from 'src/endpoints/accounts/account.service';
import { DelegationLegacyService } from 'src/endpoints/delegation.legacy/delegation.legacy.service';

expect.extend({
    toHaveStructure(received: any, keys: string[]) {
        const objectSortedKeys = JSON.stringify(Object.keys(received).sort());
        const expectedKeys = JSON.stringify(keys.sort());

        const pass = objectSortedKeys === expectedKeys;
        if (pass) {
            return {
                pass: true,
                message: () => `expected ${Object.keys(received)} not to be a valid ${keys} `,
            }
        } 
        else {
            return {
                pass: false,
                message: () => `expected ${Object.keys(received)} to be a valid ${keys} `,
            }
        }
    },
});

describe('Account Service', () => {
    let accountService: AccountService;
    let delegationLegacyService: DelegationLegacyService;
    let accountAddress: string;
  
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
          imports: [PublicAppModule],
        }).compile();
  
        accountService = moduleRef.get<AccountService>(AccountService);
        delegationLegacyService = moduleRef.get<DelegationLegacyService>(DelegationLegacyService);

        let accounts = await accountService.getAccounts({from: 0, size: 1});
        expect(accounts).toHaveLength(1);

        let account = accounts[0];
        accountAddress = account.address;
    });

    describe('Accounts list', () => {
        it(`should return a list with 25 accounts`, async () => {
            const accountsList = await accountService.getAccounts({from: 0, size: 25});

            expect(accountsList).toBeInstanceOf(Array);
            expect(accountsList).toHaveLength(25);

            for (let account of accountsList) {
                expect(account).toHaveStructure(Object.keys(new Account()));
            }
        });
        it(`should return a list with 50 accounts`, async () => {
            const accountsList = await accountService.getAccounts({from: 0, size: 50});
            expect(accountsList).toBeInstanceOf(Array);
            expect(accountsList).toHaveLength(50);

            for (let account of accountsList) {
                expect(account).toHaveStructure(Object.keys(new Account()));
            }
        });
    });

    describe('Accounts count', () => {
        it(`should return a number`, async () => {
            const accountsCount: Number = new Number(await accountService.getAccountsCount());

            expect(accountsCount).toBeInstanceOf(Number);
        });
    });

    describe('Specific account', () => {
        describe('Account Details', () => {
            it(`should return a detailed account with account address`, async () => {
                const accountDetailed = await accountService.getAccount(accountAddress);
    
                expect(accountDetailed).toHaveStructure(Object.keys(new AccountDetailed()));
                expect(accountDetailed.address).toStrictEqual(accountAddress);
    
            });
    
            it(`should throw 'Account not found' error`, async () => {
                await expect(accountService.getAccount(accountAddress + 'a')).rejects.toThrowError('Account not found');
            });

        describe('Account Delegation Legacy', () => {
            it(`should return a delegation legacy for an account with address`, async () => {
                const accountDelegationLegacy = await delegationLegacyService.getDelegationForAddress(accountAddress);
    
               
                expect(accountDelegationLegacy).toHaveStructure(Object.keys(new AccountDelegationLegacy()));
            });
    
            it(`should throw 'Account not found' error`, async () => {
                await expect(delegationLegacyService.getDelegationForAddress(accountAddress + 'a')).toBeUndefined();
            });
        });
        });
    });

});