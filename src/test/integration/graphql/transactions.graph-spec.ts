import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Transactions', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Transaction', () => {
    it('should return transaction details for a given transaction hash', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            transaction(input:{
          hash: "22eae3fd93d2ad09f09d5aa76c22655532dd5ab14805f242fec920e484c26778"
            }){
              txHash
              gasLimit
              gasPrice
              gasUsed
              miniBlockHash
              nonce
              receipt{
                data
                sender
                value
              }
              receiver{
                address
                shard
              }
              sender{
                address
                shard
              }
              signature
              status
              value
              fee
              timestamp
              data
              action{
                arguments
                name
                category
                description
                
              }
              results {
                hash
                timestamp
                nonce
                gasLimit
                gasPrice
                value
                sender
                receiver
                data
                prevTxHash
                originalTxHash
                callType
              }
              logs {
                id
                address
                events{
                  address
                  identifier
                  topics
                }
              }
            }
          }`,
        })
        .expect(200)
        .then(res => {
          const txHash: string = "22eae3fd93d2ad09f09d5aa76c22655532dd5ab14805f242fec920e484c26778";

          expect(res.body.data.transaction).toBeDefined();
          expect(res.body.data.transaction.txHash).toStrictEqual(txHash);
          expect(res.body.data.transaction.results).toBeDefined();
          expect(res.body.data.transaction.logs).toBeDefined();
        });
    });
  });

  describe('Query - Get Count', () => {
    [
      {
        filter: 'hashes',
        value: `["2d4875377f4ce54d8f8ba51cfeaa50b85a9ce20520a66fdaabb3ebdf9e3195a1", "5a873cbc1ead69bc474a93f2dbffa689c1bb84c413ab7b634682f0c4c4e430af"]`,
        count: 2,
      },
      {
        filter: 'sender',
        value: '"erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"',
        count: 28,
      },
      {
        filter: 'senderShard',
        value: '1',
        count: 28075100,
      },
      {
        filter: 'receiverShard',
        value: '2',
        count: 12605200,
      },
      {
        filter: 'receiver',
        value: '"erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"',
        count: 30,
      },
      {
        filter: 'miniBlockHash',
        value: '"362ab57e2688b0040bd1593e7719e13564db03e873b3d204c4bb0aa54e7a1bc3"',
        count: 1,
      },
      {
        filter: 'before',
        value: '1660114204',
        count: 54345000,
      },
      {
        filter: 'after',
        value: '1660134204',
        count: 975560,
      },

    ].forEach(({ filter, value, count }) => {
      describe(`filter = ${filter}`, () => {
        it(`should return total count based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{transactionsCount(input:{
              ${filter}: ${value}
            })
          }`,
            })
            .expect(200)
            .then(res => {
              expect(res.body.data.transactionsCount).toBeGreaterThanOrEqual(count);
            });
        });
      });
    });
  });

  describe('Query - Get Transactions', () => {
    it('should return transactions based on hashes filter', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            transactions(input:{
              hashes: ["2d4875377f4ce54d8f8ba51cfeaa50b85a9ce20520a66fdaabb3ebdf9e3195a1", "5a873cbc1ead69bc474a93f2dbffa689c1bb84c413ab7b634682f0c4c4e430af"]
            }){
              
            txHash
            gasLimit
            gasPrice
            gasUsed
            miniBlockHash
            nonce
            receipt{
              data
              sender
              value
            }
            receiver{
              address
              shard
            }
            sender{
              address
              shard
            }
            signature
            status
            value
            fee
            timestamp
            data
            action{
              arguments
              name
              category
              description
            }
            results {
              hash
              timestamp
              nonce
              gasLimit
              gasPrice
              value
              sender
              receiver
              data
              prevTxHash
              originalTxHash
              callType
            }
            logs {
              id
              address
              events{
                address
                identifier
                topics
              }
            }
          }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.transactions).toBeDefined();
          expect(res.body.data.transactions[0].txHash).toStrictEqual('2d4875377f4ce54d8f8ba51cfeaa50b85a9ce20520a66fdaabb3ebdf9e3195a1');
          expect(res.body.data.transactions[1].txHash).toStrictEqual('5a873cbc1ead69bc474a93f2dbffa689c1bb84c413ab7b634682f0c4c4e430af');
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
