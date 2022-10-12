import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Miniblocks Controller", () => {
  let app: INestApplication;
  const path: string = "/miniblocks";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/miniblocks', () => {
    it('should return miniBlock details for a given identifier', async () => {
      const miniblock: string = 'e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c';
      const expected = {
        miniBlockHash: "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c",
        receiverBlockHash: "ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f",
        receiverShard: 2,
        senderBlockHash: "ee60ef38ab592d4a32a3ba5783996ae72afda9d2bf40295fcf7c43915120227f",
        senderShard: 2,
        timestamp: 1644529902,
        type: "TxBlock",
      };

      await request(app.getHttpServer())
        .get(`${path}/${miniblock}`)
        .expect(200)
        .then(res => {
          expect(res.body).toStrictEqual(expected);
        });
    });
  });

  describe('Validations', () => {
    it('should return 400 Bad Request if an invalid block hash is given', async () => {
      const miniBlockHash: string = 'invalidMiniBlockHash';

      await request(app.getHttpServer())
        .get(`${path}/${miniBlockHash}`)
        .expect(400)
        .then(res => {
          expect(res.body.message).toContain("Validation failed");
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
