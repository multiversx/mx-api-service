import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Network', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Query - Get Constants', () => {
    it('should returns network-specific constants that can be used to automatically configure dapps', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            constants{
              chainId
              gasPerDataByte
              minGasLimit
              minGasPrice
              minTransactionVersion
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.constants.chainId).toBeDefined();
          expect(res.body.data.constants.gasPerDataByte).toBeDefined();
          expect(res.body.data.constants.minGasLimit).toBeDefined();
          expect(res.body.data.constants.minGasPrice).toBeDefined();
          expect(res.body.data.constants.minTransactionVersion).toBeDefined();
        });
    });
  });

  describe('Query - Get Economics', () => {
    it('should returns general economics information', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            economics{
              totalSupply
              circulatingSupply
              staked
              apr
              topUpApr
              baseApr
              tokenMarketCap
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.economics.totalSupply).toBeDefined();
          expect(res.body.data.economics.circulatingSupply).toBeDefined();
          expect(res.body.data.economics.apr).toBeDefined();
          expect(res.body.data.economics.topUpApr).toBeDefined();
          expect(res.body.data.economics.baseApr).toBeDefined();
          expect(res.body.data.economics.tokenMarketCap).toBeDefined();
        });
    });
  });

  describe('Query - Get Stats', () => {
    it('should returns general network statistics', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            stats{
              shards
              blocks
              accounts
              transactions
              refreshRate
              epoch
              roundsPassed
              roundsPerEpoch
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.stats.shards).toBeDefined();
          expect(res.body.data.stats.blocks).toBeDefined();
          expect(res.body.data.stats.accounts).toBeDefined();
          expect(res.body.data.stats.transactions).toBeDefined();
          expect(res.body.data.stats.refreshRate).toBeDefined();
          expect(res.body.data.stats.epoch).toBeDefined();
          expect(res.body.data.stats.roundsPassed).toBeDefined();
          expect(res.body.data.stats.roundsPerEpoch).toBeDefined();
        });
    });
  });
});
