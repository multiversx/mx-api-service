import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Sc-Results Controller", () => {
  let app: INestApplication;
  const route: string = "/sc-results";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  it("/sc-results - should return 200 status code and one list of sc-results", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/sc-results?from&size - should return 200 status code and one list of 10 sc-results", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '10',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/sc-results?miniBlockHash - should return 200 status code and sc-result details based on miniBlockHash", async () => {
    const params = new URLSearchParams({
      'miniBlockHash': 'aa0e0deef3e8b8fbd73f3e63e113270733d34cb2a4a2bcbe359c800da4ae155e',
    });
    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/sc-results/count - should return 200 status code and sc-results total count", async () => {
    await request(app.getHttpServer())
      .get(route + "/count")
      .expect(200);
  });

  it("/sc-results{scHash} - should return 200 status code and sc-result details based om scHash", async () => {
    const hash: string = "15b7adeaec77fd2e9bd2680834ea552028f10caff59e68a332d9c32f9b371590";
    await request(app.getHttpServer())
      .get(route + "/" + hash)
      .expect(200);
  });

  it("/sc-results{scHash} - should return 404 status code Error: Not Found", async () => {
    const hash: string = "15b7adeaec77fd2e9bd2680834ea552028f10caff59e68a332d9c32f9b371590T";
    await request(app.getHttpServer())
      .get(route + "/" + hash)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Smart contract result not found");
      });
  });
});
