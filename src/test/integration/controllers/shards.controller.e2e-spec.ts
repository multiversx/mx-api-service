import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Shard } from 'src/endpoints/shards/entities/shard';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Shards Controller", () => {
  let app: INestApplication;
  const path: string = "/shards";

  beforeAll(async () => {
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
        expect(res.body).toBeInstanceOf(Array<Shard>);
        expect(res.body.length).toBeGreaterThanOrEqual(4);
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

  it("should return 2 shards details", async () => {
    const params = new URLSearchParams({
      'from': '1',
      'size': '2',
    });
    await request(app.getHttpServer())
      .get(`${path}?${params}`)
      .expect(200)
      .then(res => {
        console.log(res.body);
        expect(res.body).toBeInstanceOf(Array<Shard>);
        expect(res.body.length).toStrictEqual(2);
        for (let i = 0; i < res.body.length; i++) {
          expect(res.body[i].shard).toBeDefined();
          expect(res.body[i].validators).toBeDefined();
          expect(res.body[i].activeValidators).toBeDefined();
        }
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
