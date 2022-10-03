import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Identities', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Identities', () => {
    it('should returns a list of all node identities, used to group nodes by the same entity. "Free-floating" nodes that do not belong to any identity will also be returned', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            identities{
              locked
              distribution
              name
              score
              validators
              stake
              topUp
              providers
              stakePercent
              apr
              rank
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.identities[0]).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
