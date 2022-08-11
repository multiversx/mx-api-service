import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Maiar Exchange Controller", () => {
  let app: INestApplication;
  const path: string = "/mex";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("should returns economics details of Maiar Exchange ", async () => {
    await request(app.getHttpServer())
      .get(`${path}/economics`)
      .expect(200)
      .then(res => {
        expect(res.body.totalSupply).toBeDefined();
        expect(res.body.circulatingSupply).toBeDefined();
        expect(res.body.price).toBeDefined();
        expect(res.body.marketCap).toBeDefined();
        expect(res.body.volume24h).toBeDefined();
        expect(res.body.marketPairs).toBeDefined();
      });
  });

  it("should returns 25 active liquidity pools available on Maiar Exchange ", async () => {
    await request(app.getHttpServer())
      .get(`${path}/pairs`)
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(25);
      });
  });

  it("should returns list of 25 tokens listed on Maiar Exchange ", async () => {
    await request(app.getHttpServer())
      .get(`${path}/tokens`)
      .expect(200)
      .then(res => {
        expect(res.body).toHaveLength(25);
      });
  });

  it("should returns list of farms listed on Maiar Exchange ", async () => {
    await request(app.getHttpServer())
      .get(`${path}/farms`)
      .expect(200)
      .then(res => {
        expect((res.body).length).toBeGreaterThanOrEqual(20);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
