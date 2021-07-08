import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { TransactionController } from 'src/endpoints/transactions/transaction.controller';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { QueryCondition } from 'src/helpers/entities/query.condition';
import { TransactionStatus } from 'src/endpoints/transactions/entities/transaction.status';

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

describe('Transaction Controller', () => {
    let transactionController: TransactionController;
    let transactionHash: string;
    let transactionSender: string;
    let transactionReceiver: string;
  
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
          imports: [PublicAppModule],
        }).compile();
  
        transactionController = moduleRef.get<TransactionController>(TransactionController);
    });

    describe('Transactions list', () => {
        describe('Transactions pagination', () => {
            it(`should return a list with 25 transactions`, async () => {
                const transactionsList = await transactionController.getTransactions(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 25);
    
                expect(transactionsList).toBeInstanceOf(Array);
                expect(transactionsList).toHaveLength(25);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    transactionHash = transaction.txHash;
                    transactionSender = transaction.sender;
                    transactionReceiver = transaction.receiver;
                }
            });
    
            it(`should return a list with 100 transactions`, async () => {
                const transactionsList = await transactionController.getTransactions(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 100);;
                expect(transactionsList).toBeInstanceOf(Array);
                expect(transactionsList).toHaveLength(100);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                }
            });
        })
        
        describe('Transactions filters', () => {
            it(`should return a list of transactions between two accounts`, async () => {
                const transactionsList = await transactionController.getTransactions(transactionSender, transactionReceiver, undefined, undefined, undefined, undefined, QueryCondition.must, undefined, undefined, 0, 25);
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.sender).toBe(transactionSender);
                    expect(transaction.receiver).toBe(transactionReceiver);
                }
            });
    
            it(`should return a list with pending transactions`, async () => {
                const transactionsList = await transactionController.getTransactions(undefined, undefined, undefined, undefined, undefined, TransactionStatus.pending, undefined, undefined, undefined, 0, 100);;
                expect(transactionsList).toBeInstanceOf(Array);

                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.status).toBe(TransactionStatus.pending);
                }
            });

            it(`should return a list with transactions in one date range`, async () => {
                const before = 1625559162;
                const after = 1625559108;
                const transactionsList = await transactionController.getTransactions(undefined, undefined, undefined, undefined, undefined, undefined, undefined, before, after, 0, 100);;
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.timestamp).toBeGreaterThanOrEqual(after);
                    expect(transaction.timestamp).toBeLessThanOrEqual(before);
                }
            });

            it(`should return a list with transactions for an adress, in one date range, with success status`, async () => {
                const after = 1625559108;
                const address = transactionSender;
                const transactionsList = await transactionController.getTransactions(address, address, undefined, undefined, undefined, TransactionStatus.success, QueryCondition.should, undefined, after, 0, 100);
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    if(transaction.sender !== address && transaction.receiver !== address)
                    {
                        expect(false);
                    }
                    expect(transaction.timestamp).toBeGreaterThanOrEqual(after);
                    expect(transaction.status).toBe(TransactionStatus.success);
                }
            });
        })
    
    });

    describe('Transaction count', () => {
        it(`should return a number`, async () => {
            const transactionsCount: Number = new Number(await transactionController.getTransactionCount(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 25));

            expect(transactionsCount).toBeInstanceOf(Number);
        });
    })

    describe('Specific transaction', () => {
        it(`should return a transaction for a specific hash`, async () => {
            const transaction = await transactionController.getTransaction(transactionHash);

            expect(transaction.txHash).toBe(transactionHash);
        });

        it(`should throw 'Transaction not found' error`, async () => {

            await expect(transactionController.getTransaction(transactionHash + 'a')).rejects.toThrowError('Transaction not found');
        });
    })
});