import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicAppModule } from 'src/public.app.module';
import request = require('supertest');

describe("Network Controller", () => {
  let app: INestApplication;
  const constantPath: string = "/constants";
  const economicsPath: string = "/economics";
  const statsPath: string = "/stats";
  const aboutPath: string = "/about";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PublicAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("should returns network-specific constants that can be used to automatically configure dapps ", async () => {
    await request(app.getHttpServer())
      .get(`${constantPath}`)
      .expect(200)
      .then(res => {
        expect(res.body.chainId).toBeDefined();
        expect(res.body.gasPerDataByte).toBeDefined();
        expect(res.body.minGasLimit).toBeDefined();
        expect(res.body.minGasPrice).toBeDefined();
        expect(res.body.minTransactionVersion).toBeDefined();
      });
  });

  it("should returns general economics information ", async () => {
    await request(app.getHttpServer())
      .get(`${economicsPath}`)
      .expect(200)
      .then(res => {
        expect(res.body.totalSupply).toBeDefined();
        expect(res.body.circulatingSupply).toBeDefined();
        expect(res.body.staked).toBeDefined();
        expect(res.body.apr).toBeDefined();
        expect(res.body.topUpApr).toBeDefined();
        expect(res.body.baseApr).toBeDefined();
        expect(res.body.tokenMarketCap).toBeDefined();
      });
  });

  it("should returns general network statistics ", async () => {
    await request(app.getHttpServer())
      .get(`${statsPath}`)
      .expect(200)
      .then(res => {
        expect(res.body.shards).toBeDefined();
        expect(res.body.blocks).toBeDefined();
        expect(res.body.accounts).toBeDefined();
        expect(res.body.transactions).toBeDefined();
        expect(res.body.refreshRate).toBeDefined();
        expect(res.body.epoch).toBeDefined();
        expect(res.body.roundsPassed).toBeDefined();
        expect(res.body.roundsPerEpoch).toBeDefined();
      });
  });

  it("should returns information about API deployment ", async () => {
    await request(app.getHttpServer())
      .get(`${aboutPath}`)
      .expect(200)
      .then(res => {
        expect(res.body.appVersion).toBeDefined();
        expect(res.body.network).toBeDefined();
        expect(res.body.version).toBeDefined();
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
