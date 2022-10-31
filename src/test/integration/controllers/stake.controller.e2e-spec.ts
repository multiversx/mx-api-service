import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Stake Controller", () => {
  let app: INestApplication;
  const path: string = "/stake";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("should return general staking details", async () => {
    await request(app.getHttpServer())
      .get(`${path}`)
      .expect(200)
      .then(res => {
        expect(res.body.totalValidators).toBeDefined();
        expect(res.body.activeValidators).toBeDefined();
        expect(res.body.queueSize).toBeDefined();
        expect(res.body.totalStaked).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
