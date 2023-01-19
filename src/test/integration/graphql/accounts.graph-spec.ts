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

  describe('Query - Get Account smart contracts results Count', () => {
    it('should return total number of smart contracts results', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            account(input:{
              address: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"
            }){
              scrCount
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account.scrCount).toBeGreaterThanOrEqual(41);
        });
    });
  });

  describe('Query - Get account transactions count', () => {
    it('should return total number of transactions', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            account(input:{
              address: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"
            }){
              txCount
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account.txCount).toBeGreaterThanOrEqual(32);
        });
    });
  });

  describe('Query - Get account contracts count', () => {
    it('should return total number of contracts', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            account(input:{
              address: "erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz"
            }){
              contractAccountCount
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account.contractAccountCount).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('Query - Get account stake details', () => {
    it('should return total staked amount for the given provider ', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            account(input:{
              address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu"
            }){
             stake{
              totalStaked
              unstakedTokens{
                amount
                epochs
                expires
              }
            }
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account.stake).toBeDefined();
          expect(res.body.data.account.stake.totalStaked).toBeDefined();
          expect(res.body.data.account.stake.unstakedTokens).toBeDefined();
        });
    });
  });

  describe('Query - Get account keys details', () => {
    it('should return all active/queued nodes where given account is owner ', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            account(input:{
              address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu"
            }){
            keys{
              blsKey
              queueIndex
              queueSize
              rewardAddress
              stake
              status
              topUp
            }
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.account.keys).toBeDefined();
          for (const item of res.body.data.account.keys) {
            expect(item.blsKey).toBeDefined();
            expect(item.queueIndex).toBeDefined();
            expect(item.queueSize).toBeDefined();
            expect(item.rewardAddress).toBeDefined();
            expect(item.stake).toBeDefined();
            expect(item.status).toBeDefined();
            expect(item.topUp).toBeDefined();
          }
        });
    });
  });



  afterEach(async () => {
    await app.close();
  });
});
