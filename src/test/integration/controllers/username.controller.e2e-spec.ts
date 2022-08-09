import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Username Controller", () => {
  let app: INestApplication;
  const path: string = "/usernames";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/usernames/{username}', () => {
    it('should return return account details for a given herotag', async () => {
      const herotag: string = 'alice';

      await request(app.getHttpServer())
        .get(`${path}/${herotag}`)
        .expect(302);
    });
  });

  describe('Validations', () => {
    it('should return code 404 Not Found and response message', async () => {
      const herotag: string = 'InvalidHeroTag';

      await request(app.getHttpServer())
        .get(`${path}/${herotag}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual('Account not found');
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
