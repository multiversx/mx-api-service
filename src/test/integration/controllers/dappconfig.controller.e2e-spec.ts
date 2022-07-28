import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Dapp-Config Controller", () => {
  let app: INestApplication;

  const route: string = "/dapp/config";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/dapp/config - should return 200 status code and dapp configuration for a specific network", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });
});
