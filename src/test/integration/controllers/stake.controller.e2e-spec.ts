import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Stake Controller", () => {
  let app: INestApplication;
  const route: string = "/stake";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/stake - should return 200 status code stake details ( totalValidators, activeValidators, queueSize, totalStaked", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });
});
