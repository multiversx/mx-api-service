import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Shard', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Shards', () => {
    it('should returns all available shards', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            shards(input:{
            }){
              shard
              validators
              activeValidators
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.shards).toBeDefined();
          expect(res.body.data.shards).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ shard: 0 || 1 || 2 || 4294967295 })])
          );
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
