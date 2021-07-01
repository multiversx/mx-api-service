import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request from 'supertest';

describe('Cats', () => {
  let app: INestApplication;
  // let catsService = { findAll: () => ['test'] };

  beforeAll(async (done) => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    })
      // .overrideProvider(CatsService)
      // .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(8080);

    done();
  });

  it(`/GET hello`, () => {
    return request(app.getHttpServer())
      .get('/transactions')
      .expect(200)
      .expect((_: request.Response) => {
        throw new Error('something bad happened');
      })
  });

  afterAll((done) => {
    console.log('in the end');
    done();
  });
});