import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import { TransactionStatus } from 'src/endpoints/transactions/entities/transaction.status';
import { TransactionService } from 'src/endpoints/transactions/transaction.service';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import Initializer from './e2e-init';
import { Constants } from 'src/utils/constants';
import { QueryConditionOptions } from 'src/common/entities/elastic/query.condition.options';

describe('Transaction Service', () => {
    let transactionService: TransactionService;
    let transactionHash: string;
    let transactionSender: string;
    let transactionReceiver: string;

    beforeAll(async () => {
      await Initializer.initialize();
    }, Constants.oneHour() * 1000);
  
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
          imports: [PublicAppModule],
        }).compile();
  
        transactionService = moduleRef.get<TransactionService>(TransactionService);

        const transactionFilter = new TransactionFilter();

        let transactions = await transactionService.getTransactions(transactionFilter, { from: 0, size: 1});
        expect(transactions).toHaveLength(1);

        let transaction = transactions[0];
        transactionHash = transaction.txHash;
        transactionSender = transaction.sender;
        transactionReceiver = transaction.receiver;

    });

    describe('Transactions list', () => {
        it('transactions should have txHash, sender and receiver', async () => {
            const transactionFilter = new TransactionFilter();
            const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });

            for (let transaction of transactionsList) {
                expect(transaction).toHaveProperty('txHash');
                expect(transaction).toHaveProperty('sender');
                expect(transaction).toHaveProperty('receiver');
            }
        });

        describe('Transactions pagination', () => {
            it(`should return a list with 25 transactions`, async () => {
                const transactionFilter = new TransactionFilter();
                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
    
                expect(transactionsList).toBeInstanceOf(Array);
                expect(transactionsList).toHaveLength(25);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                }
            });
    
            it(`should return a list with 100 transactions`, async () => {
                const transactionFilter = new TransactionFilter();
                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 100 });

                expect(transactionsList).toBeInstanceOf(Array);
                expect(transactionsList).toHaveLength(100);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                }
            });
        })
        
        describe('Transactions filters', () => {
            it(`should return a list of transactions between two accounts`, async () => {
                const transactionFilter = new TransactionFilter();
                transactionFilter.sender = transactionSender;
                transactionFilter.receiver = transactionReceiver;
                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });

                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.sender).toBe(transactionSender);
                    expect(transaction.receiver).toBe(transactionReceiver);
                }
            });
    
            it(`should return a list with pending transactions`, async () => {
                const transactionFilter = new TransactionFilter();
                transactionFilter.status = TransactionStatus.pending;
                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
                expect(transactionsList).toBeInstanceOf(Array);

                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.status).toBe(TransactionStatus.pending);
                }
            });

            it(`should return a list with transactions in one date range`, async () => {
                const transactionFilter = new TransactionFilter();
                transactionFilter.before = 1625559162;
                transactionFilter.after = 1625559108;
                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
                    expect(transaction.timestamp).toBeLessThanOrEqual(transactionFilter.before);
                }
            });

            it(`should return transactions for an address`, async () => {
                const address = transactionSender
                const transactionFilter = new TransactionFilter();
                transactionFilter.sender = address;
                transactionFilter.receiver = address;
                transactionFilter.condition = QueryConditionOptions.should;

                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    if (transaction.sender !== address && transaction.receiver !== address) {
                        expect(false);
                    }
                }
            })

            it(`should return transactions for an address with self transactions`, async () => {
                const address = transactionSender
                const transactionFilter = new TransactionFilter();
                transactionFilter.sender = address;
                transactionFilter.receiver = address;

                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 }, undefined, address);
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    if (transaction.sender !== address || transaction.receiver !== address) {
                        expect(false);
                    }
                }
            })

            it(`should return a list with transactions where an address is sender, in one date range, with success status`, async () => {
                const address = transactionSender
                const transactionFilter = new TransactionFilter();
                transactionFilter.after = 1625559108;
                transactionFilter.sender = address;
                transactionFilter.status = TransactionStatus.success;

                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
                expect(transactionsList).toBeInstanceOf(Array);
    
                for (let transaction of transactionsList) {
                    expect(transaction).toHaveStructure(Object.keys(new Transaction()));
                    expect(transaction.sender).toBe(address);
                    expect(transaction.timestamp).toBeGreaterThanOrEqual(transactionFilter.after);
                    expect(transaction.status).toBe(TransactionStatus.success);
                }
            });



            it(`should return transactions with specific hashes`, async () => {
                const hashes = '8149581fe858edf8971a73491ff4b26ce2532aa7951ffefafb7b7823ffacc182,56bdbc1a2e9e4dd60bb77c82a72c5b2b77ef51b8decf97f4024fa223b9b64777,INVALIDTXHASH';
                const transactionFilter = new TransactionFilter();
                transactionFilter.hashes = hashes;

                const transactionsList = await transactionService.getTransactions(transactionFilter, { from: 0, size: 25 });
                expect(transactionsList).toHaveLength(2);
                const transactionsHashes = transactionsList.map(({txHash}) => txHash);
                expect(hashes.split(',').toString()).not.toStrictEqual(transactionsHashes.toString());
            })
        })
    
    });

    describe('Transaction count', () => {
        it(`should return a number`, async () => {
            const transactionsCount: Number = new Number(await transactionService.getTransactionCount(new TransactionFilter()));

            expect(transactionsCount).toBeInstanceOf(Number);
        });
    })

    describe('Specific transaction', () => {
        it(`should return a transaction for a specific hash`, async () => {
            const transaction = await transactionService.getTransaction(transactionHash);

            if (transaction) {
             expect(transaction.txHash).toBe(transactionHash);
            }
        });

        it(`should throw 'Transaction not found' error`, async () => {
            expect(await transactionService.getTransaction(transactionHash + 'a')).toBeNull();
        });
    })
});