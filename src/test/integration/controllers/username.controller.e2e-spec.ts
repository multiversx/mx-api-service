import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Username Controller", () => {
  let app: INestApplication;
  const path: string = "/usernames";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/usernames/{username}', () => {
    it('should return return account details for a given username', async () => {
      const username: string = 'alice';

      await request(app.getHttpServer())
        .get(`${path}/${username}`)
        .expect(302);
    });
  });

  describe('Validations', () => {
    it('should return code 404 Not Found and response message', async () => {
      const username: string = 'InvalidUsername';

      await request(app.getHttpServer())
        .get(`${path}/${username}`)
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
