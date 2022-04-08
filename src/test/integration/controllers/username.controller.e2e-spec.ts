import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Usernames Controller", () => {
  let app: INestApplication;
  const route: string = "/usernames";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/usernames/:username - should return 302 status code and account details based on username", async () => {
    const username: string = "alice";

    await request(app.getHttpServer())
      .get(route + "/" + username)
      .expect(302);
  });

  it("/usernames/:username - should return 404 status code Error: Not Found", async () => {
    const username: string = "aliceTest";

    await request(app.getHttpServer())
      .get(route + "/" + username)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Account not found");
      });
  });
});
