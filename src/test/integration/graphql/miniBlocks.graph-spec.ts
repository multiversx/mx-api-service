import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PublicAppModule } from "src/public.app.module";
import request = require('supertest');

describe('MiniBlocks', () => {
  let app: INestApplication;
  const gql = '/graphql';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Query - Get MiniBlock', () => {
    it('should returns miniblock details for a given miniBlockHash.', async () => {
      const miniBlockHash: string = `"e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c"`;
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            miniBlockHash(input:{
              miniBlockHash: ${miniBlockHash}
            }){
              miniBlockHash
              receiverBlockHash
              receiverShard
              senderBlockHash
              senderShard
              timestamp
              type
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.data.miniBlockHash).toBeDefined();
          expect(res.body.data.miniBlockHash.miniBlockHash).toStrictEqual('e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c');
        });
    });

    it('should return "Miniblock not found" .', async () => {
      const miniBlockHash: string = `"e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4"`;
      await request(app.getHttpServer())
        .post(gql)
        .send({
          query: `{
            miniBlockHash(input:{
              miniBlockHash: ${miniBlockHash}
            }){
              miniBlockHash
              receiverBlockHash
              receiverShard
              senderBlockHash
              senderShard
              timestamp
              type
            }
          }`,
        })
        .expect(200)
        .then(res => {
          expect(res.body.errors[0].message).toStrictEqual('Miniblock not found');
          expect(res.body.errors[0].extensions.code).toStrictEqual("404");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
