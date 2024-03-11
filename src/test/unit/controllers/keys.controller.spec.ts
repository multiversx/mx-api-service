import { INestApplication } from "@nestjs/common";
import { mockKeysService } from "./services.mock/keys.services.mock";
import { Test } from "@nestjs/testing";
import { KeysController } from "src/endpoints/keys/keys.controller";
import { KeysService } from "src/endpoints/keys/keys.service";
import request = require('supertest');
import { PublicAppModule } from "src/public.app.module";

describe('KeysController', () => {
  let app: INestApplication;
  const path: string = "/keys";
  const keysServiceMocks = mockKeysService();

  beforeAll(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      controllers: [KeysController],
      imports: [PublicAppModule],
    })
      .overrideProvider(KeysService)
      .useValue(keysServiceMocks)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /keys/:key/unbond-period', () => {
    it('should return remaining unbonding period for a given bls key', async () => {
      keysServiceMocks.getKeyUnbondPeriod.mockReturnValue({});
      const blsKey = '0002137b3137114c28bea6aae2620cee51b25ba82c81628ab3a7f3b536523ebdfb738bded448de693485361ccf1c4907a55448afda9316dac02a39b41e4f18835ee4786493eb60b0627c0b30d68800af4e75bd5a614d53a94850cf9561e2ec8a';

      await request(app.getHttpServer())
        .get(`${path}/${blsKey}/unbond-period`)
        .expect(200);

      expect(keysServiceMocks.getKeyUnbondPeriod).toHaveBeenCalledWith(blsKey);
    });

    it('should throw 404 Key not found', async () => {
      keysServiceMocks.getKeyUnbondPeriod.mockReturnValue(undefined);
      const blsKey = '0002137b3137114c28bea6aae2620cee51b25ba82c81628ab3a7f3b536523ebdfb738bded448de693485361ccf1c4907a55448afda9316dac02a39b41e4f18835ee4786493eb60b0627c0b30d68800af4e75bd5a614d53a94850cf9561e2ec8a';

      await request(app.getHttpServer())
        .get(`${path}/${blsKey}/unbond-period`)
        .expect(404);

      expect(keysServiceMocks.getKeyUnbondPeriod).toHaveBeenCalledWith(blsKey);
    });

    it('should throw 400 Bad Request if given blsKey is not valid', async () => {
      keysServiceMocks.getKeyUnbondPeriod.mockReturnValue({});
      const blsKey = 'invalid-bls-key';

      await request(app.getHttpServer())
        .get(`${path}/${blsKey}/unbond-period`)
        .expect(400);
    });
  });
});
