import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Miniblocks Controller", () => {
  let app: INestApplication;
  const route: string = "/miniblocks";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/miniblocks{miniBlockHash} - should return 200 status code and miniblock details", async () => {
    const miniblock: string = "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4c";

    await request(app.getHttpServer())
      .get(route + "/" + miniblock)
      .expect(200);
  });

  it("/miniblocks{miniBlockHash} - should return 404 status code Error: Bad Request", async () => {
    const miniblock: string = "e336ba1b720bb153b4e0d2049d722b0e39bf275f9d35e79b0f757271a963ad4cT";

    await request(app.getHttpServer())
      .get(route + "/" + miniblock)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Miniblock not found");
      });
  });
});
