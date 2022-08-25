import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Accounts', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Accounts', () => {
    it('should return 25 accounts', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{ accounts(input:{
            size: 25
          }){
            address
            balance
            nonce
            shard
            assets{
              name
              description
              tags
              iconPng
              iconSvg
            }
          }
        }`,
        })
        .expect(200)
        .then(res => {
          for (const item of res.body.data.accounts) {
            expect(item.address).toBeDefined();
          }
          expect(res.body.data.accounts).toBeDefined();
          expect(res.body.data.accounts).toHaveLength(25);
        });
    });
  });

  describe('Query - Get Account', () => {
    it('should return account details for a given address', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{ account(input:{
            address: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"
          }){
            address
            balance
            nonce
            shard
            rootHash
            txCount
            scrCount
            username
            developerReward
          }
        }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account).toBeDefined();
        });
    });
  });

  describe('Query - Get Accounts Count', () => {
    it('should return total number of accounts', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{ accountsCount
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.accountsCount).toBeGreaterThanOrEqual(1797710);
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
