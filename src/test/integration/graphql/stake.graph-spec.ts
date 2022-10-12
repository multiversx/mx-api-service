import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Stake', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Stake', () => {
    it('should returns general staking information', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            stake {
              totalValidators
              activeValidators
              queueSize
              totalStaked
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.stake).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
