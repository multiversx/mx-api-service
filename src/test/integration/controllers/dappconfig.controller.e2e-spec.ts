import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Dapp-Config Controller", () => {
  let app: INestApplication;
  const path: string = "/dapp/config";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('/dapp/config', () => {
    it('should return configuration used in dapps', async () => {
      await request(app.getHttpServer())
        .get(`${path}`)
        .expect(200)
        .then(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBeDefined();
          expect(res.body.egldLabel).toBeDefined();
          expect(res.body.decimals).toBeDefined();
          expect(res.body.egldDenomination).toBeDefined();
          expect(res.body.gasPerDataByte).toBeDefined();
          expect(res.body.apiTimeout).toBeDefined();
          expect(res.body.walletConnectDeepLink).toBeDefined();
          expect(res.body.walletConnectBridgeAddresses).toBeDefined();
          expect(res.body.walletAddress).toBeDefined();
          expect(res.body.apiAddress).toBeDefined();
          expect(res.body.explorerAddress).toBeDefined();
          expect(res.body.chainId).toBeDefined();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
