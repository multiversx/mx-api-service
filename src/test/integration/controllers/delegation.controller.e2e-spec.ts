import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Delegations Controller", () => {
  let app: INestApplication;
  const delegation: string = "/delegation";
  const delegationLegacy: string = "/delegation-legacy";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/delegation - should return 200 status code and delegation details", async () => {
    await request(app.getHttpServer())
      .get(delegation)
      .expect(200);
  });

  it("/delegation-legacy - should return 200 status code and delegation-legacy details", async () => {
    await request(app.getHttpServer())
      .get(delegationLegacy)
      .expect(200);
  });
});
