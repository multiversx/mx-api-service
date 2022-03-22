import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Identities Controller", () => {
  let app: INestApplication;
  const route: string = "/identities";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/identities - should return 200 status code and a list of identities", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/identities/{identifier} - should return 404 status code Error Code: Identity not found", async () => {
    const identifier: string = "justminingfrT";

    await request(app.getHttpServer())
      .get(route + "/" + identifier)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Identity not found");
      });
  });
});
