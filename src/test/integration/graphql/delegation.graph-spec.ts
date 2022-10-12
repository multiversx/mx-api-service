import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Delegation', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Delegation details', () => {
    it('should return delegation staking contract information', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            delegation{
              stake
              topUp
              locked
              minDelegation
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.delegation).toBeDefined();
          expect(res.body.data.delegation.stake).toBeDefined();
          expect(res.body.data.delegation.topUp).toBeDefined();
          expect(res.body.data.delegation.locked).toBeDefined();
          expect(res.body.data.delegation.minDelegation).toBeDefined();
        });
    });
  });
});
