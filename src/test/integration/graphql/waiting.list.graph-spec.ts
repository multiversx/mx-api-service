import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('WaitingList', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Waiting List', () => {
    it('should returns node waiting list', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            waitingList{
              address
              value
              nonce
              rank
            }
          }`,
        })
        .expect(200)
        .then(res => {
          for (const item of res.body.data.waitingList) {
            expect(item.address).toBeDefined();
            expect(item.value).toBeDefined();
            expect(item.nonce).toBeDefined();
            expect(item.rank).toBeDefined();
          }
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
