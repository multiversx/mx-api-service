import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe.skip('WebSocket', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get Websocket url', () => {
    it('should returns config used for accessing websocket on the same cluster', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            webSocketConfig{
              url
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.webSocketConfig).toBeDefined();
          expect(res.body.data.webSocketConfig.url).toContain('socket');
        });
    });
  });
});
