import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Nodes Controller", () => {
  let app: INestApplication;
  const path: string = "/nodes";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/nodes', () => {
    it('should return all nodes with status "jailed"', async () => {
      const params = new URLSearchParams({
        'status': 'jailed',
      });
      await request(app.getHttpServer())
        .get(`${path}?${params}`)
        .expect(200)
        .then(res => {
          for (const response of res.body) {
            console.log(response);
            expect(response.status).toStrictEqual('jailed');
          }
        });
    });
  });
});
