import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Usernames Controller", () => {
  let app: INestApplication;
  const route: string = "/hello";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/hello - should return status code 200 and response message 'hello' ", async () => {

    await request(app.getHttpServer())
      .get(route)
      .expect(200)
      .then(res => {
        expect(res.text).toStrictEqual('hello');
      });
  });
});
