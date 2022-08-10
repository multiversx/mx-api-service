import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe.skip("Identities Controller", () => {
  let app: INestApplication;
  const path: string = "/identities";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/identities', () => {
    it(`should returns a list of 25 node identities, used to group nodes by the same entity
       "Free-floating" nodes that do not belong to any identity will also be returned`, async () => {

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect((res.body).length).toBeGreaterThanOrEqual(25);
        });
    });
  });

  describe('/identities/{identifier}', () => {
    it('should returns the details of a single identitiy', async () => {
      const identifier: string = 'elrondcom';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(200)
        .then(res => {
          expect(res.body.identitiy).toStrictEqual('elrondcom');
          expect(res.body.locked).toBeDefined();
          expect(res.body.distribution).toBeDefined();
          expect(res.body.avatar).toBeDefined();
          expect(res.body.description).toBeDefined();
          expect(res.body.name).toBeDefined();
          expect(res.body.score).toBeDefined();
          expect(res.body.validators).toBeDefined();
          expect(res.body.stake).toBeDefined();
          expect(res.body.topUp).toBeDefined();
          expect(res.body.stakePercent).toBeDefined();
          expect(res.body.apr).toBeDefined();
          expect(res.body.rank).toBeDefined();
        });
    });
  });

  describe('Validations', () => {
    it('should return 404 Not Found if a given identity identifier is not found', async () => {
      const identifier = 'abc123';

      await request(app.getHttpServer())
        .get(`${path}/${identifier}`)
        .expect(404)
        .then(res => {
          expect(res.body.message).toStrictEqual('Identity not found');
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
