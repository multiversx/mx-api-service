import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Providers', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Providers', () => {
    it('should returns a list of all providers', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            providers(input:{
            }){
              provider
              serviceFee
              delegationCap
              apr
              numUsers
              cumulatedRewards
              identity
              numNodes
              stake
              topUp
              locked
              featured
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.providers).toBeDefined();
        });
    });

    it('should returns provider details', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            providers(input:{
              identity: "binance_staking"
            }){
              provider
              serviceFee
              delegationCap
              apr
              numUsers
              cumulatedRewards
              identity
              numNodes
              stake
              topUp
              locked
              featured
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.providers).toBeDefined();
          expect(res.body.data.providers[0].identity).toStrictEqual("binance_staking");
          expect(res.body.data.providers[0].provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu");
        });
    });

    it('should returns provider details based on address', async () => {
      const address: string = `"erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu"`;
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            provider(input:{
              address: ${address}
            }){
              provider
              serviceFee
              delegationCap
              apr
              numUsers
              cumulatedRewards
              identity
              numNodes
              stake
              topUp
              locked
              featured
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.provider).toBeDefined();
          expect(res.body.data.provider.identity).toStrictEqual("binance_staking");
          expect(res.body.data.provider.provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
