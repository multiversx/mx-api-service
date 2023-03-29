import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('Username', () => {
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

  describe('Query - Get Account details', () => {
    it('should username account details', async () => {
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            username(input:{
               username: "alice"
            }){
              address
              balance
              nonce
              shard
              rootHash
              txCount
              scrCount
              username
              developerReward
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.username.username).toStrictEqual("alice.elrond");
        });
    });
  });
});
