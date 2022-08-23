import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Shards Controller", () => {
  let app: INestApplication;
  const path: string = "/shards";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("should return all available shards", async () => {
    await request(app.getHttpServer())
      .get(`${path}`)
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(4);
      });
  });

  it("should return 1 shard details", async () => {
    const params = new URLSearchParams({
      'size': '1',
    });
    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(200)
      .then(res => {
        expect(res.body[0].shard).toBeDefined();
        expect(res.body[0].validators).toBeDefined();
        expect(res.body[0].activeValidators).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
