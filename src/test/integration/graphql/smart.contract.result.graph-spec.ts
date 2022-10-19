import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Smart Contract Results', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Smart Contract Results', () => {
    it('should returns 5 smart contract results available on the blockchain', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            results(input:{
              size: 5
            }){
              hash
              timestamp
              nonce
              gasLimit
              gasPrice
              value
              sender
              receiver
              receiverAssets{
                name
                tags
              }
              data
              prevTxHash
              originalTxHash
              callType
              miniBlockHash
              action{
                category
                name
                description
                arguments
              }
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.scResults).toBeDefined();
        });
    });
  });

  describe('Query - Get Smart Contract Result', () => {
    const miniBlockHash: string = "067c4d662c03c8d17b0feb14217734a6a0a341e96ab922b657f9eb3c515b7773";
    [
      {
        filter: 'originalTxHashes',
        value: '"758480f61a6530a7d5f11e6074626672d6a1a880882fbf47ca1fc554436ec2ad"',
      },
      {
        filter: 'miniBlockHash',
        value: '"067c4d662c03c8d17b0feb14217734a6a0a341e96ab922b657f9eb3c515b7773"',
      },

    ].forEach(({ filter, value }) => {
      describe(`filter = ${filter}`, () => {
        it(`should return smart contract result based on ${filter} filter with value ${value}`, async () => {
          await request(app.getHttpServer())
            .post(gql)
            .send({
              query: `{
                results(input:{
                 ${filter}: ${value}
                }){
                  hash
                  timestamp
                  nonce
                  gasLimit
                  gasPrice
                  value
                  sender
                  receiver
                  receiverAssets{
                    name
                    tags
                  }
                  data
                  prevTxHash
                  originalTxHash
                  callType
                  miniBlockHash
                  action{
                    category
                    name
                    description
                    arguments
                  }
                }
              }`,
            })
            .then(res => {
              expect(res.body.data.scResults[0].miniBlockHash).toStrictEqual(miniBlockHash);
            });
        });
      });
    });
  });

  describe('Query - Get Smart Contract Results Count', () => {
    it('should returns smart contract results count', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            resultsCount
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.scResultsCount).toBeGreaterThanOrEqual(110372303);
        });
    });
  });

  describe('Query - Get Smart Contract Result', () => {
    it('should returns smart contract results details based on scHash', async () => {
      const scHash: string = "a5c935b7639a40e7d0e169f2053dcff3ebcbf04c8ee38799bb2075f1fa3f1688";
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            result(input:{
              scHash: "a5c935b7639a40e7d0e169f2053dcff3ebcbf04c8ee38799bb2075f1fa3f1688"
            }){
              hash
              timestamp
              nonce
              gasLimit
              gasPrice
              value
              sender
              receiver
              prevTxHash
              originalTxHash
              callType
              miniBlockHash
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.scResult).toBeDefined();
          expect(res.body.data.scResult.hash).toStrictEqual(scHash);
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
