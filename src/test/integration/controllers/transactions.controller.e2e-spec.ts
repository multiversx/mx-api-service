import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Transactions Controller", () => {
  let app: INestApplication;
  const path: string = "/transactions";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  [
    {
      filter: 'sender',
      value: '4294967295',
    },
    {
      filter: 'sender',
      value: 'erd1576w79rz7zq8jv5nuzrnntghrxjnzapjppcv6u7pya257gk9x9eq59qrhu',
    },
  ].forEach(({ filter, value }) => {
    describe(`when filter ${filter} is applied`, () => {
      it(`should return transaction sender with value ${value}`, async () => {
        await request(app.getHttpServer())
          .get(`${path}?${filter}=${value}`)
          .expect(200)
          .then(res => {
            expect(res.body).toBeDefined();
            expect(res.body[0].sender).toStrictEqual(value);
          });
      });
    });
  });

  [
    {
      filter: 'sender',
      value: '4294967295',
      count: 12900,
    },
    {
      filter: 'sender',
      value: 'erd1576w79rz7zq8jv5nuzrnntghrxjnzapjppcv6u7pya257gk9x9eq59qrhu',
      count: 189,
    },
  ].forEach(({ filter, value, count }) => {
    describe(`when filter ${filter} is applied`, () => {
      it(`should return total number of transactions of sender ${value}`, async () => {
        await request(app.getHttpServer())
          .get(`${path}/count?${filter}=${value}`)
          .expect(200)
          .then(res => {
            expect(+res.text).toBeGreaterThanOrEqual(count);
          });
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
