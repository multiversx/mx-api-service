import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Tags', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Tags details', () => {
    it('should return 25 tags', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tags(input:{
              size:25
            }){
              tag
              count
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tags).toBeDefined();
          expect(res.body.data.tags).toHaveLength(25);
        });
    });
  });

  describe('Query - Get Tags count', () => {
    it('should return total tags count', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            tagsCount
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.tagsCount).toBeGreaterThanOrEqual(32100);
        });
    });
  });
});
