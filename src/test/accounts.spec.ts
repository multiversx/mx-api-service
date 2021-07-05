import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { AccountController } from 'src/endpoints/accounts/account.controller';
import { Account } from 'src/endpoints/accounts/entities/account';
import { AccountDetailed } from 'src/endpoints/accounts/entities/account.detailed';
import { AccountDeferred } from 'src/endpoints/accounts/entities/account.deferred';
import { AccountDelegationLegacy } from 'src/endpoints/delegation.legacy/entities/account.delegation.legacy';

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

describe('Account Controller', () => {
    let accountController: AccountController;
    let accountAddress: string;
    // let accountTokenIdentifier: string;
  
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
          imports: [PublicAppModule],
        }).compile();
  
        accountController = moduleRef.get<AccountController>(AccountController);
    });

    describe('Accounts list', () => {
        it(`should return a list with 25 accounts`, async () => {
            const accountsList = await accountController.getAccounts(0, 25);

            expect(accountsList).toBeInstanceOf(Array);
            expect(accountsList).toHaveLength(25);

            for(let account of accountsList)
            {
                expect(account).toHaveStructure(Object.keys(new Account()));
                accountAddress = account.address;
            }
        });

        it(`should return a list with 100 accounts`, async () => {
            const accountsList = await accountController.getAccounts(0, 100);
            expect(accountsList).toBeInstanceOf(Array);
            expect(accountsList).toHaveLength(100);

            for(let account of accountsList)
                expect(account).toHaveStructure(Object.keys(new Account()));
        });
    
    });

    describe('Accounts count', () => {
        it(`should return a number`, async () => {
            const accountsCount: Number = new Number(await accountController.getAccountsCount());

            expect(accountsCount).toBeInstanceOf(Number);
        });
    
    });

    describe('Specific account', () => {
        describe('Account Details', () => {
            it(`should return a detailed account with account address`, async () => {
                const accountDetailed = await accountController.getAccountDetails(accountAddress);
    
                expect(accountDetailed).toHaveStructure(Object.keys(new AccountDetailed()));
                expect(accountDetailed.address).toStrictEqual(accountAddress);
    
            });
    
            it(`should throw 'Account not found' error`, async () => {
                await expect(accountController.getAccountDetails(accountAddress + 'a')).rejects.toThrowError('Account not found');
            });
        })
        
        describe('Account Deffered', () => {
            it(`should return a deferred account with account address`, async () => {
                const accountDeferred = await accountController.getAccountDeferred(accountAddress);
    
                for(let deffered of accountDeferred)
                    expect(deffered).toHaveStructure(Object.keys(new AccountDeferred()));
            });
    
            it(`should throw 'Account not found' error`, async () => {
                await expect(accountController.getAccountDeferred(accountAddress + 'a')).rejects.toThrowError('Account not found');
            });
        })

        describe('Account Delegation Legacy', () => {
            it(`should return a delegation legacy for an account with address`, async () => {
                const accountDelegationLegacy = await accountController.getAccountDelegationLegacy(accountAddress);
    
               
                expect(accountDelegationLegacy).toHaveStructure(Object.keys(new AccountDelegationLegacy()));
            });
    
            it(`should throw 'Account not found' error`, async () => {
                await expect(accountController.getAccountDelegationLegacy(accountAddress + 'a')).rejects.toThrowError('Account not found');
            });
        })

        //TIMEOUT
        // describe('Account Tokens', () => {
        //     it(`should return a list of account tokens`, async () => {
        //         const accountTokens = await accountController.getAccountTokens(accountAddress, 0, 25);
    
        //         for(let token of accountTokens)
        //         {
        //             expect(token).toHaveStructure(Object.keys(new TokenWithBalance()));
        //             accountTokenIdentifier = token.token;
        //         }
        //     });
    
        //     it(`should throw 'Account not found' error`, async () => {
        //         await expect(accountController.getAccountTokens(accountAddress + 'a', 0, 25)).rejects.toThrowError('Account not found');
        //     });

        //     it(`should throw error because a token identifiers isn't set`, async () => {
        //         // const accountToken = await accountController.getAccountToken(accountAddress, accountTokenIdentifier);
    
                
        //         // expect(accountToken).toHaveStructure(Object.keys(new TokenWithBalance()));

        //         await expect(accountController.getAccountToken(accountAddress, accountTokenIdentifier)).rejects.toThrowError('Token not found')
        //     });
        // })
    });
});