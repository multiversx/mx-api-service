import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Providers', () => {
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

  describe('Query - Get Providers', () => {
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
          expect(res.body.data.provider.provider).toStrictEqual("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc0llllsayxegu");
        });
    });

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
  });
});
