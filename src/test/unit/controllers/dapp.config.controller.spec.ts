import { INestApplication } from "@nestjs/common";
import { mockDappConfigService } from "./services.mock/dapp.config.services.mock";
import { Test, TestingModule } from "@nestjs/testing";
import { DappConfigController } from "src/endpoints/dapp-config/dapp.config.controller";
import { DappConfigModule } from "src/endpoints/dapp-config/dapp.config.module";
import { DappConfigService } from "src/endpoints/dapp-config/dapp.config.service";
import request = require('supertest');

describe('DappConfigController', () => {
  let app: INestApplication;
  const path = "/dapp/config";
  const dappConfigServiceMock = mockDappConfigService();

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DappConfigController],
      imports: [DappConfigModule],
    })
      .overrideProvider(DappConfigService)
      .useValue(dappConfigServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('GET /dapp/config', () => {
    it('should return dapp config details', async () => {
      dappConfigServiceMock.getDappConfiguration.mockReturnValue({});

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200);

      expect(dappConfigServiceMock.getDappConfiguration).toHaveBeenCalled();
    });

    it('should throw 404 configuration not found', async () => {
      dappConfigServiceMock.getDappConfiguration.mockReturnValue(undefined);

      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(404)
        .expect(response => {
          expect(response.body.message).toStrictEqual('Network configuration not found');
        });
      expect(dappConfigServiceMock.getDappConfiguration).toHaveBeenCalled();
    });
  });
});
