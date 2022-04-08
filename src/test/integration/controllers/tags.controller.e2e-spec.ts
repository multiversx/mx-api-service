import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Tags Controller", () => {
  let app: INestApplication;
  const route: string = "/tags";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("/tags - should return 200 status code and one list of tags", async () => {
    await request(app.getHttpServer())
      .get(route)
      .expect(200);
  });

  it("/tags?from=&size - should return 200 status code and one list of 50 tags", async () => {
    const params = new URLSearchParams({
      'from': '0',
      'size': '50',
    });

    await request(app.getHttpServer())
      .get(route + "?" + params)
      .expect(200);
  });

  it("/tags/:tag - should return 200 status code and specific tag details", async () => {
    const tag: string = "RWxyb25k";

    await request(app.getHttpServer())
      .get(route + "/" + tag)
      .expect(200);
  });

  it("/tags/:tag - should return 404 status code Error: Not Found", async () => {
    const tag: string = "RWxyb25kT";

    await request(app.getHttpServer())
      .get(route + "/" + tag)
      .expect(404)
      .then(res => {
        expect(res.body.message).toEqual("Nft tag not found");
      });
  });
});
