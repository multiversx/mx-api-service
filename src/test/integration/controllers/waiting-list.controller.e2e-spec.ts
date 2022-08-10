import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Waiting-List Controller", () => {
  let app: INestApplication;
  const path: string = "/waiting-list";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/waiting-list - should return 200 status code and one list of accounts in waiting-list", async () => {
    await request(app.getHttpServer())
      .get(`${path}`)
      .expect(200);
  });

  it("/waiting-list/count - should return 200 status code and waiting-lists total count", async () => {
    await request(app.getHttpServer())
      .get(`${path}/count`)
      .expect(200);
  });

  it("/waiting-list/c - should return 200 status code and waiting-lists total count (alternative)", async () => {
    await request(app.getHttpServer())
      .get(`${path}/c`)
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
