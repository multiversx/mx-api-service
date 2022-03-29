import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Shards Controller", () => {
  let app: INestApplication;
  const route: string = "/shards";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/shards - should return 200 status code and list of shards details", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/shards?from&size - should return 200 status code and list of 10 shards details", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });
});
