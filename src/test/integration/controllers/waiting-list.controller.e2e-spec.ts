import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Waiting-List Controller", () => {
  let app: INestApplication;
  const route: string = "/waiting-list";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/waiting-list - should return 200 status code and one list of accounts in waiting-list", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/waiting-list/count - should return 200 status code and waiting-lists total count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/waiting-list/c - should return 200 status code and waiting-lists total count (alternative)", async () => {
    await request(app.getHttpServer())
      .get(route + "/c")
      .expect(200);
  });
});
